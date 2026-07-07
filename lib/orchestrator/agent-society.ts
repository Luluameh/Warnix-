// lib/orchestrator/agent-society.ts
// The Master Orchestrator. Coordinates the 7-agent collaboration society.
// Runs Round 1 in parallel, triggers Round 2 negotiation via NEXUS, synthesizes the decision.

import { prisma } from '@/lib/db/prisma';
import { AgentId, SPECIALIST_AGENT_IDS } from '@/types';
import type {
  AgentRunContext, AgentVoteResponse, CoordinatorDecision,
  IncidentInput, HistoricalIncidentRecord,
} from '@/types';
import { SigmaAgent } from '@/lib/agents/sigma.agent';
import { AxiomAgent } from '@/lib/agents/axiom.agent';
import { HeraldAgent } from '@/lib/agents/herald.agent';
import { AegisAgent } from '@/lib/agents/aegis.agent';
import { AtlasAgent } from '@/lib/agents/atlas.agent';
import { ArchiveAgent } from '@/lib/agents/archive.agent';
import { NexusAgent } from '@/lib/agents/nexus.agent';
import type { IAgent } from '@/lib/agents/base/agent-types';
import { sharedMemory } from '@/lib/memory/shared-memory';
import { sseRegistry } from '@/lib/sse/emitter';
import { EVENTS } from '@/lib/sse/types';
import { NegotiationEngine } from './negotiation-engine';
import { DebateEngine } from './debate-engine';

export class AgentSociety {
  private agents = new Map<AgentId, IAgent>();
  private negotiationEngine: NegotiationEngine;

  constructor() {
    this.agents.set(AgentId.SIGMA, new SigmaAgent());
    this.agents.set(AgentId.AXIOM, new AxiomAgent());
    this.agents.set(AgentId.HERALD, new HeraldAgent());
    this.agents.set(AgentId.AEGIS, new AegisAgent());
    this.agents.set(AgentId.ATLAS, new AtlasAgent());
    this.agents.set(AgentId.ARCHIVE, new ArchiveAgent());
    this.agents.set(AgentId.NEXUS, new NexusAgent());

    this.negotiationEngine = new NegotiationEngine(this.agents);
  }

  /**
   * Run the multi-agent incident resolution cycle.
   */
  async resolveIncident(
    incidentId: string,
    runId: string,
    overrideInstruction?: string,
  ): Promise<CoordinatorDecision> {
    // 1. Fetch current incident data
    const incident = await prisma.incident.findUniqueOrThrow({
      where: { id: incidentId },
    });

    const ctx: AgentRunContext = {
      runId,
      incidentId,
      incident: {
        title: incident.title,
        type: incident.type as any,
        severity: incident.severity,
        location: incident.location,
        latitude: incident.latitude,
        longitude: incident.longitude,
        description: incident.description,
        demoMode: incident.demoMode,
      },
      round: 1,
      humanOverride: overrideInstruction,
    };

    // 2. Setup memory layers
    sharedMemory.create(incidentId, runId);
    if (overrideInstruction) {
      sharedMemory.setHumanOverride(runId, overrideInstruction);
    }

    // Load historical incident data to ARCHIVE agent
    const history = await prisma.historicalIncident.findMany();
    const archiveAgent = this.agents.get(AgentId.ARCHIVE) as ArchiveAgent;
    if (archiveAgent) {
      archiveAgent.setHistoricalData(history as unknown as HistoricalIncidentRecord[]);
    }

    // Emit initial SSE event
    sseRegistry.emitEvent(runId, incidentId, EVENTS.ROUND_1_START, 'SYSTEM', 1, {
      runId,
      incidentId,
    });

    // ─── ROUND 1: Parallel Specialist Runs ──────────────────────────────────
    
    // Set all agents to thinking status
    for (const agentId of SPECIALIST_AGENT_IDS) {
      sseRegistry.emitEvent(runId, incidentId, EVENTS.AGENT_STATUS, agentId, 1, {
        agentId,
        status: 'THINKING',
        message: 'Synthesizing incident context...',
      });
    }

    // Run SIGMA and ARCHIVE first in parallel (data ingestion & precedent check)
    const runSigma = this.runAgentSafe(AgentId.SIGMA, ctx);
    const runArchive = this.runAgentSafe(AgentId.ARCHIVE, ctx);
    const [sigmaVote, archiveVote] = await Promise.all([runSigma, runArchive]);

    // Save outputs in a list of votes
    const votes: AgentVoteResponse[] = [sigmaVote, archiveVote];

    // Propagate updates to shared memory blackboard
    if (sigmaVote.rawOutput) {
      const type = (sigmaVote.rawOutput as any).incident_type;
      const sev = (sigmaVote.rawOutput as any).severity;
      if (type) sharedMemory.setAgreedIncidentType(runId, type);
      if (sev) sharedMemory.setAgreedSeverity(runId, sev);
    }

    // Call AXIOM, HERALD, and AEGIS in parallel
    const runAxiom = this.runAgentSafe(AgentId.AXIOM, ctx);
    const runHerald = this.runAgentSafe(AgentId.HERALD, ctx);
    const runAegis = this.runAgentSafe(AgentId.AEGIS, ctx);
    const [axiomVote, heraldVote, aegisVote] = await Promise.all([runAxiom, runHerald, runAegis]);
    votes.push(axiomVote, heraldVote, aegisVote);

    // Call ATLAS last (depends on blocked routes and allocated resource states)
    const atlasVote = await this.runAgentSafe(AgentId.ATLAS, ctx);
    votes.push(atlasVote);

    // Save all round 1 votes in DB
    await Promise.all(
      votes.map(v =>
        prisma.agentVote.create({
          data: {
            agentRunId: runId,
            incidentId,
            agentId: v.agentId,
            round: 1,
            confidence: v.confidence,
            urgency: v.urgency,
            vote: v.vote,
            recommendation: v.recommendation,
            reasoning: v.reasoning,
            risks: v.detectedRisks,
            memoryUsed: v.shortTermMemoryUsed,
            memoryInfluence: v.memoryInfluence,
            rawOutput: v.rawOutput as any,
          },
        })
      )
    );

    // ─── ROUND 2: Interrogation & Resolution ──────────────────────────────
    const nexusAgent = this.agents.get(AgentId.NEXUS) as NexusAgent;
    const round1Assessment = await nexusAgent.runRound1Assessment(ctx, votes);

    let answers: Array<{ agentId: AgentId; question: string; answer: string }> = [];

    // Trigger sequential interrogation round if NEXUS detected conflicts or triggers
    if (round1Assessment.needs_round_2 && round1Assessment.round_2_questions.length > 0) {
      // Set run status to ROUND_2 in database
      await prisma.agentRun.update({
        where: { id: runId },
        data: { currentRound: 2, status: 'ROUND_2' },
      });

      answers = await this.negotiationEngine.runNegotiationRound(ctx, round1Assessment.round_2_questions);
    }

    // ─── DECISION FORMULATION ──────────────────────────────────────────────
    const finalDecision = await nexusAgent.runFinalDecision(ctx, votes, answers);

    // Update agent run status in DB
    const finalStatus = finalDecision.humanApprovalRequired ? 'AWAITING_HUMAN' : 'COMPLETED';
    const snapshot = sharedMemory.snapshot(runId);

    await prisma.agentRun.update({
      where: { id: runId },
      data: {
        status: finalStatus,
        completedAt: finalDecision.humanApprovalRequired ? null : new Date(),
        finalDecision: finalDecision as any,
        sharedMemorySnapshot: snapshot,
      },
    });

    // If completed and not awaiting human, complete corresponding incident resource deployments
    if (!finalDecision.humanApprovalRequired) {
      await this.deployResources(incidentId, finalDecision);
    }

    // Emit final decision via SSE
    sseRegistry.emitEvent(runId, incidentId, EVENTS.COORDINATOR_DECISION, 'NEXUS', 2, finalDecision as any);

    // Clean memory layer
    sharedMemory.delete(runId);

    // Send complete marker
    sseRegistry.emitEvent(runId, incidentId, EVENTS.RUN_COMPLETE, 'SYSTEM', 2, {
      runId,
      incidentId,
      status: finalStatus,
    });

    return finalDecision;
  }

  /**
   * Safely run a specialist agent catching errors.
   */
  private async runAgentSafe(agentId: AgentId, ctx: AgentRunContext): Promise<AgentVoteResponse> {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error(`AgentSociety: agent "${agentId}" not found in roster`);
    try {
      return await agent.run(ctx);
    } catch (err) {
      console.error(`Error running agent ${agentId}:`, err);
      // Fallback response so orchestration flow doesn't crash on bad LLM response
      const fallback: AgentVoteResponse = {
        agentId,
        confidence: 0.5,
        urgency: 0.5,
        vote: 'PARTIAL',
        recommendation: 'Standby for direct instruction.',
        reasoning: `Failure in agent execution: ${err instanceof Error ? err.message : String(err)}`,
        detectedRisks: [],
        agreesWith: [],
        disagreesWith: [],
        shortTermMemoryUsed: false,
        memoryInfluence: null,
        rawOutput: {},
      };
      this.agents.get(AgentId.NEXUS)?.respond(`Critical error running agent ${agentId}`, ctx);
      return fallback;
    }
  }

  /**
   * Helper to write final resource allocations to the database.
   */
  private async deployResources(incidentId: string, decision: CoordinatorDecision): Promise<void> {
    const allocations = decision.finalPlan?.resources ?? [];
    if (allocations.length === 0) return;

    // Create deployment record
    await prisma.deployment.create({
      data: {
        incidentId,
        approvedBy: 'AI',
        plan: decision.finalPlan as any,
      },
    });

    for (const alloc of allocations) {
      // Find an available resource of matching type
      const resource = await prisma.resource.findFirst({
        where: { type: alloc.resource, status: 'AVAILABLE' },
      });

      if (resource) {
        // Set resource to DEPLOYED in database
        await prisma.resource.update({
          where: { id: resource.id },
          data: { status: 'DEPLOYED' },
        });

        // Create resource assignment
        await prisma.incidentResource.create({
          data: {
            incidentId,
            resourceId: resource.id,
            status: 'EN_ROUTE',
            etaMinutes: alloc.etaMinutes ?? 10,
            route: alloc.route ? (alloc.route as any) : null,
          },
        });

        // Post deployment log to timeline
        await prisma.timelineEntry.create({
          data: {
            incidentId,
            agentId: 'SYSTEM',
            category: 'DEPLOYMENT',
            title: `Resource dispatched: ${resource.name}`,
            detail: `Callsign: ${resource.callSign} (${resource.type}). ETA: ${alloc.etaMinutes ?? 10} minutes. Reasoning: ${alloc.reasoning}`,
            severity: 'INFO',
          },
        });
      }
    }
  }
}

// Global Process Singleton
export const agentSociety = new AgentSociety();
