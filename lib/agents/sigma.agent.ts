// lib/agents/sigma.agent.ts
// SIGMA: Incident Classification Agent

import { AgentBase } from './base/agent-base';
import { SIGMA_SYSTEM_PROMPT } from './prompts/sigma.prompt';
import { extractJSON, safeNumber, safeString, safeStringArray } from '@/lib/qwen/parse';
import { callQwen, buildMessages } from '@/lib/qwen/client';
import {
  AgentId, VoteType, MessageType, TimelineCategory,
  type AgentRunContext, type AgentVoteResponse,
} from '@/types';
import type { SigmaOutput } from './base/agent-types';

export class SigmaAgent extends AgentBase {
  readonly agentId = AgentId.SIGMA;
  readonly systemPrompt = SIGMA_SYSTEM_PROMPT;

  async run(ctx: AgentRunContext): Promise<AgentVoteResponse> {
    const { runId, incidentId, incident } = ctx;

    // Signal thinking
    this.emitStatus(runId, incidentId, 'THINKING', 'Extracting verifiable facts...');
    this.emitThinking(runId, incidentId);
    this.emitTimeline(runId, incidentId, TimelineCategory.ANALYSIS, '⬡ SIGMA: Classifying incident', 'Extracting facts, severity, and location data');

    // Build prompt
    const userPrompt = this.buildUserPrompt(ctx, [
      'Classify this incident using ONLY the information provided.',
      'Be conservative with severity — bias downward.',
      'List anything you cannot confirm under "unknowns".',
    ].join('\n'));

    // Call Qwen
    let output: SigmaOutput;
    try {
      output = await this.callLLM<SigmaOutput>(userPrompt);
    } catch {
      output = this.fallbackOutput(incident.type, incident.severity);
    }

    // Sanitise numeric fields
    const confidence = safeNumber(output as unknown as Record<string, unknown>, 'confidence', 0.6);
    const urgency    = safeNumber(output as unknown as Record<string, unknown>, 'urgency', 0.7);
    const severity   = Math.max(1, Math.min(10, Math.round(output.severity ?? incident.severity)));

    // Write key facts to shared memory
    const keyFacts = output.key_facts ?? [];
    for (const fact of keyFacts.slice(0, 3)) {
      this.writeFactToSharedMemory(runId, incidentId, fact, 2);
    }

    // Emit statement
    this.emitDebateMessage(
      runId, incidentId, MessageType.STATEMENT,
      `${incident.type} classified at severity ${severity}. ` +
      `${keyFacts[0] ?? 'Classification complete.'}` +
      (output.flags?.length ? ` Flags: ${output.flags.join(', ')}.` : ''),
    );

    // Emit reasoning
    this.emitReasoning(runId, incidentId,
      `Classified as ${output.incident_type ?? incident.type} at severity ${severity}. ` +
      `Key facts: ${keyFacts.slice(0, 2).join('; ')}. ` +
      `Unknowns: ${(output.unknowns ?? []).slice(0, 2).join('; ') || 'none noted'}.`,
      confidence, urgency,
    );

    // Save to short-term memory
    this.addMemory(incidentId,
      `Classified ${output.incident_type ?? incident.type} sev ${severity}: ${keyFacts[0] ?? '—'}`,
      confidence,
      [incident.type.toLowerCase(), `sev${severity}`, ...(output.flags ?? []).map(f => f.toLowerCase())],
    );

    // Timeline
    this.emitTimeline(runId, incidentId, TimelineCategory.ANALYSIS,
      `⬡ SIGMA: ${output.incident_type ?? incident.type} · Severity ${severity}`,
      `${keyFacts[0] ?? ''} ${output.unknowns?.length ? `· Unknowns: ${output.unknowns[0]}` : ''}`.trim(),
      severity >= 8 ? 'CRITICAL' : severity >= 5 ? 'WARNING' : 'INFO',
    );

    this.emitStatus(runId, incidentId, 'DONE', `Classified at severity ${severity}`);

    const vote = confidence >= 0.75 ? VoteType.AGREE : confidence >= 0.55 ? VoteType.PARTIAL : VoteType.DISAGREE;

    const voteResponse: AgentVoteResponse = {
      agentId: this.agentId,
      confidence,
      urgency,
      vote,
      recommendation: output.recommendation ?? `Deploy resources for ${output.incident_type ?? incident.type} response`,
      reasoning: `Incident classified as ${output.incident_type ?? incident.type} severity ${severity}. ${output.unknowns?.length ? `${output.unknowns.length} unverified claim(s) noted.` : 'Classification is complete.'}`,
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

    this.emitStatus(runId, incidentId, 'THINKING', 'Responding to NEXUS...');
    this.emitDebateMessage(runId, incidentId, MessageType.NEGOTIATION_A,
      `NEXUS asked: "${question}" — preparing response...`, 2,
    );

    const userPrompt = [
      '=== NEXUS QUESTION FOR YOU ===',
      question,
      '',
      '=== ORIGINAL INCIDENT ===',
      JSON.stringify(ctx.incident, null, 2),
      '',
      '=== SHARED CONTEXT ===',
      this.getSharedContext(runId),
      '',
      'Answer the question specifically and concisely. Be direct. 2-3 sentences maximum.',
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

  private fallbackOutput(type: string, severity: number): SigmaOutput {
    return {
      incident_type: type,
      severity,
      confirmed_location: { lat: 51.505, lng: -0.09, name: 'Location unconfirmed' },
      affected_radius_km: 1,
      estimated_casualties: null,
      key_facts: ['Incident reported — awaiting verification'],
      unknowns: ['Location accuracy', 'Scope of damage'],
      flags: ['LOCATION_AMBIGUOUS'],
      confidence: 0.5,
      urgency: 0.6,
      risks: ['Information gap may delay response'],
      recommendation: 'Wait for detailed incident report.',
      memory_influence: null,
    };
  }
}
