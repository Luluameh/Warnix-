// lib/agents/herald.agent.ts
// HERALD: External Intelligence Agent — fast, urgent, tier-tagged sources.

import { AgentBase } from './base/agent-base';
import { HERALD_SYSTEM_PROMPT } from './prompts/herald.prompt';
import { callQwen, buildMessages } from '@/lib/qwen/client';
import { safeNumber, safeStringArray } from '@/lib/qwen/parse';
import {
  AgentId, VoteType, MessageType, TimelineCategory,
  type AgentRunContext, type AgentVoteResponse,
} from '@/types';
import { sseRegistry } from '@/lib/sse/emitter';
import { SSE_EVENTS } from '@/lib/sse/types';
import { sharedMemory } from '@/lib/memory/shared-memory';
import type { HeraldOutput } from './base/agent-types';

export class HeraldAgent extends AgentBase {
  readonly agentId = AgentId.HERALD;
  readonly systemPrompt = HERALD_SYSTEM_PROMPT;

  async run(ctx: AgentRunContext): Promise<AgentVoteResponse> {
    const { runId, incidentId, incident } = ctx;

    this.emitStatus(runId, incidentId, 'THINKING', 'Scanning external sources...');
    this.emitThinking(runId, incidentId);
    this.emitTimeline(runId, incidentId, TimelineCategory.ANALYSIS, '◉ HERALD: Scanning external signals', 'Checking weather APIs, news wires, traffic feeds');

    const userPrompt = this.buildUserPrompt(ctx, [
      'Synthesise external intelligence relevant to this incident.',
      'Consider: weather conditions, road/bridge status, nearby traffic incidents, news reports.',
      'Tag every piece of information with its reliability tier (1, 2, or 3).',
      'Flag any route blockages in route_alerts.',
      'If weather could affect the response, include weather_update.',
    ].join('\n'));

    let output: HeraldOutput;
    try {
      output = await this.callLLM<HeraldOutput>(userPrompt);
    } catch {
      output = this.fallbackOutput();
    }

    const confidence = safeNumber(output as unknown as Record<string, unknown>, 'confidence', 0.65);
    const urgency    = safeNumber(output as unknown as Record<string, unknown>, 'urgency', 0.6);

    // Process news items
    const newsItems = output.news_items ?? [];
    for (const item of newsItems) {
      const content = item.tier === 1 ? `BREAKING [TIER_${item.tier}]: ${item.content}` :
                      item.tier === 2 ? `[TIER_${item.tier}]: ${item.content}` :
                      `[TIER_${item.tier} — unconfirmed]: ${item.content}`;

      this.emitDebateMessage(runId, incidentId, MessageType.EVIDENCE, content, 1, undefined, item.tier as 1 | 2 | 3);
      this.writeEvidenceToSharedMemory(runId, incidentId, item.content, item.tier as 1 | 2 | 3, item.source);
    }

    // Process route alerts
    const routeAlerts = output.route_alerts ?? [];
    for (const alert of routeAlerts) {
      if (alert.status === 'BLOCKED') {
        sharedMemory.upsertRoute(runId, {
          id: alert.routeId,
          name: alert.name,
          status: 'BLOCKED',
          blockedBy: this.agentId,
          blockedReason: alert.reason,
          confirmedAt: new Date(),
        });

        this.emitSharedMemoryWrite(runId, incidentId, 'update_route', {
          routeId: alert.routeId,
          name: alert.name,
          status: 'BLOCKED',
          blockedBy: this.agentId,
          reason: alert.reason,
        });

        sseRegistry.emitEvent(runId, incidentId, SSE_EVENTS.ROUTE_BLOCKED, this.agentId, 1, {
          routeId: alert.routeId,
          name: alert.name,
          reason: alert.reason,
          reportedBy: this.agentId,
        });

        this.emitTimeline(runId, incidentId, TimelineCategory.INTERRUPT,
          `◉ HERALD: Route BLOCKED — ${alert.name}`,
          alert.reason,
          'WARNING',
        );
      }
    }

    // Weather alert
    const weather = output.weather_update;
    if (weather?.alert) {
      sseRegistry.emitEvent(runId, incidentId, SSE_EVENTS.WEATHER_ALERT, this.agentId, 1, {
        condition: weather.condition,
        etaMinutes: weather.eta_minutes,
        reportedBy: this.agentId,
      });

      this.emitDebateMessage(runId, incidentId, MessageType.STATEMENT,
        `WEATHER ALERT: ${weather.condition}. ETA: ${weather.eta_minutes != null ? `${weather.eta_minutes} min` : 'unknown'}.`,
      );
      this.emitTimeline(runId, incidentId, TimelineCategory.INTERRUPT,
        '◉ HERALD: Weather alert', weather.condition, 'WARNING',
      );
    }

    // Summary statement
    const tier1Count = newsItems.filter(i => i.tier === 1).length;
    this.emitDebateMessage(runId, incidentId, MessageType.STATEMENT,
      `External scan complete: ${newsItems.length} intelligence item(s) ` +
      `(${tier1Count} TIER_1). ${routeAlerts.filter(r => r.status === 'BLOCKED').length} route(s) blocked.`,
    );

    this.emitReasoning(runId, incidentId,
      `${newsItems.length} external items gathered. ` +
      `${routeAlerts.filter(r => r.status === 'BLOCKED').length} blocked routes. ` +
      `${weather?.alert ? `Weather alert: ${weather.condition}.` : 'No weather alerts.'}`,
      confidence, urgency,
    );

    this.addMemory(incidentId,
      `${newsItems.length} intel items (${tier1Count} T1). ` +
      `${routeAlerts.filter(r => r.status === 'BLOCKED').length} blocked routes.`,
      confidence,
      [incident.type.toLowerCase(), 'external-intel', ...(weather?.alert ? ['weather-alert'] : [])],
    );

    this.emitTimeline(runId, incidentId, TimelineCategory.ANALYSIS,
      `◉ HERALD: ${newsItems.length} items · ${tier1Count} TIER_1`,
      `${routeAlerts.filter(r => r.status === 'BLOCKED').length} route(s) blocked`,
      urgency > 0.7 ? 'WARNING' : 'INFO',
    );

    this.emitStatus(runId, incidentId, 'DONE', `${newsItems.length} intelligence items gathered`);

    const vote =
      tier1Count > 0 ? VoteType.AGREE :
      newsItems.length > 0 ? VoteType.PARTIAL :
      VoteType.PARTIAL; // Always partial — HERALD's data is supplementary

    const voteResponse: AgentVoteResponse = {
      agentId: this.agentId,
      confidence,
      urgency,
      vote,
      recommendation: output.recommendation ?? 'Proceed with response — external intelligence gathered',
      reasoning: `${newsItems.length} external intelligence items. ${tier1Count} from TIER_1 sources. ${routeAlerts.filter(r => r.status === 'BLOCKED').length} route blockage(s) detected.`,
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

    this.emitStatus(runId, incidentId, 'THINKING', 'Clarifying source reliability...');

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
      'Clarify the source reliability and tier of the specific intelligence NEXUS is asking about. 2-3 sentences.',
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

  private fallbackOutput(): HeraldOutput {
    return {
      news_items: [],
      weather_update: null,
      route_alerts: [],
      confidence: 0.5,
      urgency: 0.5,
      risks: ['External intelligence unavailable — operating without external confirmation'],
      recommendation: 'Scan for incoming external feeds.',
      memory_influence: null,
    };
  }
}
