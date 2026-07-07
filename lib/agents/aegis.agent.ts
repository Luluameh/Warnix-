// lib/agents/aegis.agent.ts
// AEGIS: Resource Allocation Agent — brutally honest about scarcity.

import { AgentBase } from './base/agent-base';
import { AEGIS_SYSTEM_PROMPT } from './prompts/aegis.prompt';
import { callQwen, buildMessages } from '@/lib/qwen/client';
import { safeNumber, safeStringArray } from '@/lib/qwen/parse';
import {
  AgentId, VoteType, MessageType, TimelineCategory,
  type AgentRunContext, type AgentVoteResponse,
} from '@/types';
import { sseRegistry } from '@/lib/sse/emitter';
import { SSE_EVENTS } from '@/lib/sse/types';
import { sharedMemory } from '@/lib/memory/shared-memory';
import type { AegisOutput } from './base/agent-types';

export class AegisAgent extends AgentBase {
  readonly agentId = AgentId.AEGIS;
  readonly systemPrompt = AEGIS_SYSTEM_PROMPT;

  async run(ctx: AgentRunContext): Promise<AgentVoteResponse> {
    const { runId, incidentId, incident } = ctx;

    this.emitStatus(runId, incidentId, 'THINKING', 'Auditing available resources...');
    this.emitThinking(runId, incidentId);
    this.emitTimeline(runId, incidentId, TimelineCategory.ANALYSIS, '◆ AEGIS: Resource audit beginning', 'Checking inventory against requirements');

    const userPrompt = this.buildUserPrompt(ctx, [
      `Incident ID for this analysis: ${incidentId}`,
      'Determine which resources this incident requires.',
      'Check for shortages and report them prominently.',
      'If multiple incidents are competing for resources, apply the contention formula.',
      'Be honest — never allocate resources that do not exist.',
    ].join('\n'));

    let output: AegisOutput;
    try {
      output = await this.callLLM<AegisOutput>(userPrompt);
    } catch {
      output = this.fallbackOutput(incidentId);
    }

    const confidence   = safeNumber(output as unknown as Record<string, unknown>, 'confidence', 0.7);
    const urgency      = safeNumber(output as unknown as Record<string, unknown>, 'urgency', 0.7);
    const shortages    = output.shortages ?? [];
    const contentions  = output.contention ?? [];
    const allocations  = output.allocated ?? [];
    const efficiency   = safeNumber(output as unknown as Record<string, unknown>, 'efficiency_score', 0.7);

    // Register resource requests in shared memory
    for (const alloc of allocations) {
      sharedMemory.addResourceRequest(runId, alloc.resource, this.agentId, alloc.count, alloc.reasoning);
    }

    // Emit shortages as interrupt events
    for (const shortage of shortages) {
      sseRegistry.emitEvent(runId, incidentId, SSE_EVENTS.RESOURCE_SHORTAGE, this.agentId, 1, {
        type: shortage.type,
        deficit: shortage.deficit,
        affected: shortage.affected,
        mitigation: shortage.mitigation,
      });

      this.emitDebateMessage(runId, incidentId, MessageType.STATEMENT,
        `SHORTAGE: ${shortage.deficit} ${shortage.type} unit(s) deficit. Affected: ${shortage.affected.join(', ')}. Mitigation: ${shortage.mitigation}`,
        1, undefined, undefined,
      );

      this.emitTimeline(runId, incidentId, TimelineCategory.INTERRUPT,
        `◆ AEGIS: SHORTAGE — ${shortage.type}`,
        `Deficit: ${shortage.deficit}. ${shortage.mitigation}`,
        'WARNING',
      );
    }

    // Emit contention events
    for (const contention of contentions) {
      sseRegistry.emitEvent(runId, incidentId, SSE_EVENTS.RESOURCE_CONTENTION, this.agentId, 1, {
        resource: contention.resource,
        incidents: contention.incidents,
        winner: contention.winner,
        loser: contention.loser,
        formula: contention.formula,
        mitigation: contention.mitigation,
      });

      this.emitDebateMessage(runId, incidentId, MessageType.STATEMENT,
        `CONTENTION: ${contention.resource} — ${contention.winner} wins by formula: ${contention.formula}`,
      );
    }

    // Main statement
    this.emitDebateMessage(runId, incidentId, MessageType.STATEMENT,
      `Resource audit complete. ${allocations.length} allocation(s). ` +
      `${shortages.length} shortage(s). Efficiency: ${Math.round(efficiency * 100)}%.`,
    );

    this.emitReasoning(runId, incidentId,
      `Allocated ${allocations.length} resource type(s). ` +
      `${shortages.length > 0 ? `${shortages.length} shortage(s): ${shortages.map(s => s.type).join(', ')}.` : 'No shortages.'} ` +
      `Efficiency: ${Math.round(efficiency * 100)}%.`,
      confidence, urgency,
    );

    this.addMemory(incidentId,
      `Allocated: ${allocations.map(a => `${a.count} ${a.resource}`).join(', ')}. Shortages: ${shortages.map(s => s.type).join(', ') || 'none'}.`,
      confidence,
      [incident.type.toLowerCase(), 'resource-allocation', ...(shortages.length > 0 ? ['shortage'] : [])],
    );

    this.emitTimeline(runId, incidentId, TimelineCategory.ANALYSIS,
      `◆ AEGIS: Efficiency ${Math.round(efficiency * 100)}%`,
      `${shortages.length} shortage(s) · ${contentions.length} contention(s)`,
      shortages.length > 0 ? 'WARNING' : 'INFO',
    );

    this.emitStatus(runId, incidentId, 'DONE', `${shortages.length} shortage(s) flagged`);

    const vote =
      shortages.length === 0 ? VoteType.AGREE :
      shortages.length <= 2  ? VoteType.PARTIAL :
      VoteType.DISAGREE;

    const voteResponse: AgentVoteResponse = {
      agentId: this.agentId,
      confidence,
      urgency,
      vote,
      recommendation: output.recommendation ??
        (shortages.length > 0 ? `Address ${shortages.length} resource shortage(s) before finalising` : 'Proceed — resources allocated'),
      reasoning:
        `${allocations.length} allocation(s). ` +
        (shortages.length > 0 ? `${shortages.length} shortage(s) detected.` : 'No shortages.') +
        ` Efficiency: ${Math.round(efficiency * 100)}%.`,
      detectedRisks: safeStringArray(output as unknown as Record<string, unknown>, 'risks'),
      agreesWith: [],
      disagreesWith: [],
      shortTermMemoryUsed: !!output.memory_influence,
      memoryInfluence: output.memory_influence ?? null,
      rawOutput: output as unknown as Record<string, unknown>,
    };

    this.emitVote(runId, incidentId, voteResponse);
    return voteResponse;
  }

  async respond(question: string, ctx: AgentRunContext): Promise<string> {
    const { runId, incidentId } = ctx;

    this.emitStatus(runId, incidentId, 'THINKING', 'Clarifying resource availability...');

    const userPrompt = [
      '=== NEXUS QUESTION ===',
      question,
      '',
      '=== INCIDENT ===',
      JSON.stringify(ctx.incident, null, 2),
      '',
      '=== SHARED CONTEXT ===',
      this.getSharedContext(runId),
      '',
      'Answer specifically about the resource availability or shortage NEXUS is asking about. Is the proposed alternative acceptable? 2-3 sentences.',
    ].join('\n');

    const raw = await callQwen(
      buildMessages(this.systemPrompt, userPrompt),
      { agentId: this.agentId, jsonMode: false },
    );

    const answer = raw.trim();
    this.emitDebateMessage(runId, incidentId, MessageType.NEGOTIATION_A, answer, 2);
    this.emitStatus(runId, incidentId, 'WAITING', 'Awaiting NEXUS decision');
    return answer;
  }

  private fallbackOutput(incidentId: string): AegisOutput {
    return {
      available: { AMBULANCE: 3, FIRE_TRUCK: 2, RESCUE_TEAM: 1, HELICOPTER: 0, SHELTER: 2, VOLUNTEER_GROUP: 2 },
      allocated: [{ resource: 'AMBULANCE', incidentId, count: 2, reasoning: 'Standard response allocation', eta_minutes: 8 }],
      shortages: [],
      contention: [],
      efficiency_score: 0.7,
      confidence: 0.6,
      urgency: 0.6,
      risks: ['Resource data unavailable — using default allocation'],
      recommendation: 'Deploy emergency responders.',
      memory_influence: null,
    };
  }
}
