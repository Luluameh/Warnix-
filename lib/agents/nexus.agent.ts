// lib/agents/nexus.agent.ts
// NEXUS: Coordinating Decision Agent — resolves conflicts, runs Round 2 questions, decides.

import { AgentBase } from './base/agent-base';
import { NEXUS_SYSTEM_PROMPT } from './prompts/nexus.prompt';
import { callQwen, buildMessages } from '@/lib/qwen/client';
import { safeNumber, safeString } from '@/lib/qwen/parse';
import {
  AgentId, VoteType, MessageType, TimelineCategory, AGENT_WEIGHTS,
  type AgentRunContext, type AgentVoteResponse, type CoordinatorDecision,
  type AgentConsensusEntry, type ConflictResolution, type RejectedAlternative,
  type Route, type ResourceAllocation, type FinalPlan,
} from '@/types';
import { sharedMemory } from '@/lib/memory/shared-memory';
import type { NexusRound1Output, NexusFinalOutput } from './base/agent-types';

export class NexusAgent extends AgentBase {
  readonly agentId = AgentId.NEXUS;
  readonly systemPrompt = NEXUS_SYSTEM_PROMPT;

  // NEXUS implements run but it returns a structured coordinator aggregation,
  // we adapt the IAgent signature here.
  async run(ctx: AgentRunContext): Promise<AgentVoteResponse> {
    throw new Error('NEXUS Agent run() should not be called directly. Use runRound1Assessment() or runFinalDecision()');
  }

  async respond(question: string, ctx: AgentRunContext): Promise<string> {
    throw new Error('NEXUS Agent respond() should not be called directly.');
  }

  // ─── Phase 1: Round 1 Assessment ─────────────────────────────────────────

  async runRound1Assessment(
    ctx: AgentRunContext,
    votes: AgentVoteResponse[],
  ): Promise<NexusRound1Output> {
    const { runId, incidentId } = ctx;

    this.emitStatus(runId, incidentId, 'THINKING', 'Evaluating agent consensus...');
    this.emitThinking(runId, incidentId);

    const votesJson = JSON.stringify(
      votes.map(v => ({
        agentId: v.agentId,
        vote: v.vote,
        confidence: v.confidence,
        urgency: v.urgency,
        recommendation: v.recommendation,
        reasoning: v.reasoning,
        risks: v.detectedRisks,
      })),
      null,
      2,
    );

    const userPrompt = [
      '=== VISUAL AGENT VOTES ===',
      votesJson,
      '',
      '=== SHARED CONTEXT ===',
      this.getSharedContext(runId),
      '',
      'Determine if Round 2 negotiation is required based on the trigger rules.',
      'If yes, generate targeted questions for specific agents to resolve disputes or fill gaps.',
      'If not, output an empty list of questions.',
    ].join('\n');

    let output: NexusRound1Output;
    try {
      output = await this.callLLM<NexusRound1Output>(userPrompt);
    } catch {
      output = {
        round_2_questions: [],
        detected_conflicts: [],
        preliminary_confidence: 0.5,
        needs_round_2: false,
      };
    }

    // Register detected conflicts in shared memory
    const conflicts = output.detected_conflicts ?? [];
    for (const conflict of conflicts) {
      this.openConflictInSharedMemory(runId, incidentId, conflict.between[1] as AgentId, conflict.claim);
    }

    this.emitStatus(runId, incidentId, 'DONE', `Round 1 analysis complete. ${output.round_2_questions?.length ?? 0} negotiation question(s) generated.`);
    return output;
  }

  // ─── Phase 2: Final Decision ──────────────────────────────────────────────

  async runFinalDecision(
    ctx: AgentRunContext,
    votes: AgentVoteResponse[],
    answers: Array<{ agentId: AgentId; question: string; answer: string }>,
  ): Promise<CoordinatorDecision> {
    const { runId, incidentId } = ctx;

    this.emitStatus(runId, incidentId, 'THINKING', 'Synthesizing final plan...');
    this.emitThinking(runId, incidentId);

    const votesJson = JSON.stringify(
      votes.map(v => ({
        agentId: v.agentId,
        vote: v.vote,
        confidence: v.confidence,
        urgency: v.urgency,
        recommendation: v.recommendation,
        reasoning: v.reasoning,
        risks: v.detectedRisks,
      })),
      null,
      2,
    );

    const answersJson = JSON.stringify(answers, null, 2);

    const userPrompt = [
      '=== ORIGINAL AGENT VOTES ===',
      votesJson,
      '',
      '=== ROUND 2 CLARIFICATIONS ===',
      answersJson,
      '',
      '=== SHARED CONTEXT ===',
      this.getSharedContext(runId),
      '',
      'Synthesize the final plan and resolve all conflicts.',
      'Show your weighted score calculation based on the formula.',
      'Explain the rejected alternatives and the narrative explanation.',
    ].join('\n');

    let output: NexusFinalOutput;
    try {
      output = await this.callLLM<NexusFinalOutput>(userPrompt);
    } catch {
      output = this.fallbackFinalOutput(incidentId, ctx.incident.latitude, ctx.incident.longitude);
    }

    // Process conflicts resolved
    const resolved = output.conflicts_resolved ?? [];
    for (const r of resolved) {
      const openConflicts = sharedMemory.getOpenConflicts(runId);
      const matchingConflict = openConflicts.find(
        c => (c.between[0] === r.between[0] && c.between[1] === r.between[1]) ||
             (c.between[1] === r.between[0] && c.between[0] === r.between[1])
      );
      if (matchingConflict) {
        sharedMemory.resolveConflict(runId, matchingConflict.id, r.resolution);
        this.emitSharedMemoryWrite(runId, incidentId, 'resolve_conflict', {
          conflictId: matchingConflict.id,
          resolution: r.resolution,
        });

        this.emitDebateMessage(runId, incidentId, MessageType.RULING,
          `RULING: Resolved conflict between ${r.between[0]} and ${r.between[1]}. ` +
          `Resolution: ${r.resolution}. Reasoning: ${r.reasoning}`,
          2,
        );

        this.emitTimeline(runId, incidentId, TimelineCategory.NEGOTIATION,
          `⊕ NEXUS: Conflict resolved`,
          `Resolved ${r.between[0]} ↔ ${r.between[1]} debate: ${r.resolution}`,
          'INFO',
        );
      }
    }

    // Map output schema to frontend friendly CoordinatorDecision structure
    const decision: CoordinatorDecision = {
      finalPlan: {
        primaryAction: output.final_plan?.primary_action ?? 'Deploy standard response units',
        phases: output.final_plan?.phases ?? ['Deployment', 'Stabilisation'],
        resources: (output.final_plan?.resources ?? []).map(r => ({
          resource: r.resource,
          incidentId: r.incidentId,
          count: r.count,
          reasoning: r.reasoning,
          etaMinutes: r.eta_minutes ?? 10,
        })) as ResourceAllocation[],
        routes: (output.final_plan?.routes ?? []).map(r => ({
          id: r.id,
          name: r.name,
          status: r.status as Route['status'],
          waypoints: r.waypoints,
        })) as Route[],
        shelterAssignments: output.final_plan?.shelter_assignments ?? [],
        triageZones: (output.final_plan?.triage_zones ?? []).map(z => ({
          zone: z.zone,
          priority: z.priority as 1 | 2 | 3,
          lat: z.lat,
          lng: z.lng,
        })),
      },
      agentConsensus: (output.agent_consensus ?? []).map(c => ({
        agentId: c.agentId,
        vote: c.vote,
        confidence: c.confidence,
        reasoning: c.reasoning,
      })) as AgentConsensusEntry[],
      conflictsResolved: resolved.map(r => ({
        conflict: r.conflict,
        between: r.between,
        resolution: r.resolution,
        reasoning: r.reasoning,
      })) as ConflictResolution[],
      rejectedAlternatives: (output.rejected_alternatives ?? []).map(a => ({
        option: a.option,
        rejectedBy: a.rejected_by as AgentId[],
        reason: a.reason,
      })) as RejectedAlternative[],
      historicalPrecedent: output.historical_precedent ?? null,
      overallConfidence: safeNumber(output as unknown as Record<string, unknown>, 'overall_confidence', 0.75),
      overallUrgency: safeNumber(output as unknown as Record<string, unknown>, 'overall_urgency', 0.7),
      decisionNarrative: output.decision_narrative ?? 'Standard response deployed.',
      humanApprovalRequired: output.human_approval_required ?? false,
      humanCheckpoint: {
        message: output.human_checkpoint?.message ?? 'Awaiting Incident Commander review.',
        summary: output.human_checkpoint?.summary ?? 'Plan synthesized successfully.',
      },
    };

    this.emitStatus(runId, incidentId, 'DONE', 'Final decision formulated.');
    return decision;
  }

  private fallbackFinalOutput(incidentId: string, lat: number, lng: number): NexusFinalOutput {
    return {
      final_plan: {
        primary_action: 'Deploy emergency responders',
        phases: ['Phase 1: Dispatch', 'Phase 2: Stabilisation'],
        resources: [{ resource: 'AMBULANCE', incidentId, count: 2, reasoning: 'Basic EMS dispatch', eta_minutes: 8 }],
        routes: [{ id: 'ROUTE-DEFAULT', name: 'Arterial Road A', status: 'ACTIVE', waypoints: [[lat, lng], [lat + 0.01, lng + 0.01]] }],
        shelter_assignments: [],
        triage_zones: [],
      },
      agent_consensus: [],
      conflicts_resolved: [],
      rejected_alternatives: [],
      historical_precedent: null,
      weighted_score_calculation: 'Fallback calculation',
      overall_confidence: 0.7,
      overall_urgency: 0.7,
      decision_narrative: 'A fallback plan has been formulated due to model parsing limits.',
      human_approval_required: false,
      human_checkpoint: { message: 'Awaiting Commander confirmation.', summary: 'Fallback plan ready.' },
    };
  }
}
