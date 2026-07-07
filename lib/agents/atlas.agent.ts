// lib/agents/atlas.agent.ts
// ATLAS: Rescue & Evacuation Planning Agent — safety-first, route-aware.

import { AgentBase } from './base/agent-base';
import { ATLAS_SYSTEM_PROMPT } from './prompts/atlas.prompt';
import { callQwen, buildMessages } from '@/lib/qwen/client';
import { safeNumber, safeStringArray } from '@/lib/qwen/parse';
import {
  AgentId, VoteType, MessageType, TimelineCategory,
  type AgentRunContext, type AgentVoteResponse,
} from '@/types';
import { sharedMemory } from '@/lib/memory/shared-memory';
import type { AtlasOutput } from './base/agent-types';

export class AtlasAgent extends AgentBase {
  readonly agentId = AgentId.ATLAS;
  readonly systemPrompt = ATLAS_SYSTEM_PROMPT;

  async run(ctx: AgentRunContext): Promise<AgentVoteResponse> {
    const { runId, incidentId, incident } = ctx;

    this.emitStatus(runId, incidentId, 'THINKING', 'Designing evacuation plan...');
    this.emitThinking(runId, incidentId);
    this.emitTimeline(runId, incidentId, TimelineCategory.ANALYSIS, '⬟ ATLAS: Planning rescue routes', 'Route analysis and shelter assignment in progress');

    // Gather current blocked routes for context
    const blockedRoutes = sharedMemory.getBlockedRoutes(runId);
    const blockedInfo = blockedRoutes.length > 0
      ? `\nCURRENTLY BLOCKED ROUTES (from shared memory):\n${blockedRoutes.map(r => `- ${r.name}: ${r.blockedReason ?? 'blocked'} (reported by ${r.blockedBy ?? 'unknown'})`).join('\n')}`
      : '';

    const userPrompt = this.buildUserPrompt(ctx,
      `Design a rescue and evacuation plan.\n` +
      `Use coordinates near lat ${incident.latitude}, lng ${incident.longitude} for routes and shelters.\n` +
      `Check blocked routes before proposing any route.\n` +
      blockedInfo + '\n' +
      `Set needs_archive: true if you want historical precedent from ARCHIVE.`
    );

    let output: AtlasOutput;
    try {
      output = await this.callLLM<AtlasOutput>(userPrompt);
    } catch {
      output = this.fallbackOutput(incident.latitude, incident.longitude);
    }

    const confidence = safeNumber(output as unknown as Record<string, unknown>, 'confidence', 0.7);
    const urgency    = safeNumber(output as unknown as Record<string, unknown>, 'urgency', 0.7);
    const routes     = output.routes ?? [];
    const shelters   = output.shelter_assignments ?? [];
    const revisions  = output.revisions ?? [];

    // Emit route revisions
    for (const revision of revisions) {
      const revText = `ROUTE REVISION: ${revision.from} → ${revision.to}. Reason: ${revision.reason}`;
      this.emitDebateMessage(runId, incidentId, MessageType.REVISION, revText);
      this.emitTimeline(runId, incidentId, TimelineCategory.REVISION,
        `⬟ ATLAS: Route revised`,
        revText,
        'WARNING',
      );
    }

    // Write routes to shared memory
    for (const route of routes) {
      sharedMemory.upsertRoute(runId, {
        id: route.id,
        name: route.name,
        status: route.status === 'BLOCKED' ? 'BLOCKED' : route.status === 'ALTERNATE' ? 'UNCERTAIN' : 'CLEAR',
        blockedReason: route.blocked_reason ?? undefined,
      });
    }

    // Main statement
    const planSummary = output.plan?.primary_action ?? 'Rescue plan prepared';
    this.emitDebateMessage(runId, incidentId, MessageType.STATEMENT,
      `Plan ready: ${planSummary}. ` +
      `${routes.filter(r => r.status === 'ACTIVE').length} active route(s), ` +
      `${shelters.length} shelter(s), ${revisions.length} revision(s).`,
    );

    this.emitReasoning(runId, incidentId,
      `${planSummary}. ` +
      `${routes.length} route(s) planned, ${shelters.length} shelter(s) assigned. ` +
      `${revisions.length > 0 ? `${revisions.length} revision(s) due to route changes.` : ''}`,
      confidence, urgency,
    );

    this.addMemory(incidentId,
      `Plan: ${planSummary}. ${routes.length} routes, ${shelters.length} shelters, ${revisions.length} revisions.`,
      confidence,
      [incident.type.toLowerCase(), 'evacuation', ...(revisions.length > 0 ? ['route-revision'] : [])],
    );

    this.emitTimeline(runId, incidentId, TimelineCategory.ANALYSIS,
      `⬟ ATLAS: Plan ready`,
      `${routes.length} routes · ${shelters.length} shelters · ${output.triage_zones?.length ?? 0} triage zones`,
      confidence < 0.6 ? 'WARNING' : 'INFO',
    );

    this.emitStatus(runId, incidentId, 'DONE', 'Rescue plan complete');

    const vote =
      confidence >= 0.75 && revisions.length === 0 ? VoteType.AGREE :
      confidence >= 0.55 ? VoteType.PARTIAL :
      VoteType.DISAGREE;

    const voteResponse: AgentVoteResponse = {
      agentId: this.agentId,
      confidence,
      urgency,
      vote,
      recommendation: output.recommendation ?? planSummary,
      reasoning: `${planSummary}. ${routes.length} route(s). ${revisions.length > 0 ? `${revisions.length} revision(s) applied.` : ''} ${shelters.length} shelter(s) designated.`,
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

    this.emitStatus(runId, incidentId, 'THINKING', 'Evaluating alternative route...');

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
      'Answer about route safety, ETA impacts, or plan alternatives. 2-3 sentences.',
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

  private fallbackOutput(lat: number, lng: number): AtlasOutput {
    return {
      plan: {
        primary_action: 'Deploy ambulances and rescue teams to incident site',
        phases: ['Initial response', 'Triage', 'Evacuation', 'Recovery'],
      },
      routes: [{
        id: 'ROUTE-MAIN',
        name: 'Main arterial route',
        status: 'ACTIVE',
        waypoints: [[lat, lng], [lat + 0.01, lng + 0.01]],
        blocked_reason: null,
      }],
      shelter_assignments: [{
        name: 'Community Centre (fallback)',
        lat: lat + 0.02,
        lng: lng + 0.02,
        capacity: 300,
      }],
      triage_zones: [{
        zone: 'Zone A',
        priority: 1,
        lat,
        lng,
      }],
      resource_requests: { AMBULANCE: 2, RESCUE_TEAM: 1, FIRE_TRUCK: 1, HELICOPTER: 0, VOLUNTEER_GROUP: 1 },
      revisions: [],
      needs_archive: true,
      confidence: 0.6,
      urgency: 0.7,
      risks: ['Plan based on limited information — verify on arrival'],
      recommendation: 'Deploy ambulances and rescue teams to incident site.',
      memory_influence: null,
    };
  }
}
