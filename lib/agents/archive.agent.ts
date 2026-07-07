// lib/agents/archive.agent.ts
// ARCHIVE: Institutional Memory Agent — historical precedents, tiebreaker.

import { AgentBase } from './base/agent-base';
import { ARCHIVE_SYSTEM_PROMPT } from './prompts/archive.prompt';
import { callQwen, buildMessages } from '@/lib/qwen/client';
import { safeNumber } from '@/lib/qwen/parse';
import {
  AgentId, VoteType, MessageType, TimelineCategory,
  type AgentRunContext, type AgentVoteResponse,
  type HistoricalIncidentRecord,
} from '@/types';
import type { ArchiveOutput } from './base/agent-types';

export class ArchiveAgent extends AgentBase {
  readonly agentId = AgentId.ARCHIVE;
  readonly systemPrompt = ARCHIVE_SYSTEM_PROMPT;

  private historicalContext: HistoricalIncidentRecord[] = [];

  setHistoricalData(data: HistoricalIncidentRecord[]): void {
    this.historicalContext = data;
  }

  async run(ctx: AgentRunContext): Promise<AgentVoteResponse> {
    const { runId, incidentId, incident } = ctx;

    this.emitStatus(runId, incidentId, 'THINKING', 'Searching historical database...');
    this.emitThinking(runId, incidentId);
    this.emitTimeline(runId, incidentId, TimelineCategory.ANALYSIS, '◇ ARCHIVE: Searching precedents', `Looking for ${incident.type} matches in historical database`);

    // Format historical data for injection
    const histContext = this.historicalContext.length > 0
      ? `HISTORICAL DATABASE (${this.historicalContext.length} incidents):\n` +
        this.historicalContext.map(h =>
          `[${h.id}] ${h.title} (${h.year}, ${h.location}) — Type: ${h.type}, Sev: ${h.severity}\n` +
          `  Summary: ${h.summary}\n` +
          `  Tags: ${h.tags.join(', ')}`
        ).join('\n\n')
      : 'HISTORICAL DATABASE: Empty — no historical data available.';

    const userPrompt = this.buildUserPrompt(ctx, histContext);

    let output: ArchiveOutput;
    try {
      output = await this.callLLM<ArchiveOutput>(userPrompt);
    } catch {
      output = this.fallbackOutput();
    }

    const confidence = safeNumber(output as unknown as Record<string, unknown>, 'confidence', 0.6);
    const matches    = output.historical_matches ?? [];
    const best       = matches[0];

    if (output.no_precedent || matches.length === 0) {
      this.emitDebateMessage(runId, incidentId, MessageType.STATEMENT,
        'NO PRECEDENT FOUND — proceeding without historical guidance.',
      );
      this.emitTimeline(runId, incidentId, TimelineCategory.ANALYSIS,
        '◇ ARCHIVE: No precedent found', 'No historical match ≥50% similarity', 'INFO',
      );
    } else {
      // Emit best match as evidence
      const similarity = Math.round((best.similarity_score ?? 0) * 100);
      const precedentText = `PRECEDENT: ${best.title} (${best.year}, ${best.location}) — ${similarity}% match. Lesson: ${best.lessons_learned?.[0] ?? 'See full record'}`;

      this.emitDebateMessage(runId, incidentId, MessageType.EVIDENCE, precedentText, 1, undefined, 2);
      this.writeEvidenceToSharedMemory(runId, incidentId, precedentText, 2, `Historical: ${best.title} ${best.year}`);

      this.emitTimeline(runId, incidentId, TimelineCategory.ANALYSIS,
        `◇ ARCHIVE: ${best.title} (${best.year}) — ${similarity}% match`,
        best.lessons_learned?.[0] ?? best.summary,
        'INFO',
      );

      // Tiebreak support
      if (output.tiebreak_support) {
        const tbText = `TIEBREAK: Historical evidence supports ${output.tiebreak_support.supports}. Reason: ${output.tiebreak_support.reasoning}`;
        this.emitDebateMessage(runId, incidentId, MessageType.EVIDENCE, tbText, 1, undefined, 2);
      }
    }

    this.emitReasoning(runId, incidentId,
      matches.length > 0
        ? `Found ${matches.length} historical precedent(s). Best: ${best?.title ?? '—'} (${Math.round((best?.similarity_score ?? 0) * 100)}%). Key lesson: ${best?.lessons_learned?.[0] ?? '—'}`
        : 'No historical precedent found for this incident type and severity.',
      confidence, 0.5,
    );

    this.addMemory(incidentId,
      matches.length > 0
        ? `Precedent: ${best.title} ${best.year}, ${Math.round((best.similarity_score ?? 0) * 100)}% match`
        : 'No historical precedent found',
      confidence,
      [incident.type.toLowerCase(), 'historical', ...(matches.length > 0 ? ['has-precedent'] : ['no-precedent'])],
    );

    this.emitStatus(runId, incidentId, 'DONE', `${matches.length} precedent(s) found`);

    const vote =
      matches.length === 0 ? VoteType.PARTIAL :
      (best?.similarity_score ?? 0) >= 0.7 ? VoteType.AGREE :
      VoteType.PARTIAL;

    const voteResponse: AgentVoteResponse = {
      agentId: this.agentId,
      confidence,
      urgency: 0.5,
      vote,
      recommendation: output.recommended_actions?.[0] ?? (matches.length > 0 ? `Apply lessons from ${best?.title} ${best?.year}` : 'No historical precedent — proceed with standard protocols'),
      reasoning: matches.length > 0
        ? `${matches.length} historical precedent(s). Best: ${best?.title} ${best?.year} (${Math.round((best?.similarity_score ?? 0) * 100)}% similarity).`
        : 'No historical precedent found.',
      detectedRisks: output.warnings ?? [],
      agreesWith: output.tiebreak_support ? [output.tiebreak_support.supports as AgentId] : [],
      disagreesWith: [],
      shortTermMemoryUsed: false,
      memoryInfluence: null,
      rawOutput: output as unknown as Record<string, unknown>,
    };

    this.emitVote(runId, incidentId, voteResponse);
    return voteResponse;
  }

  async respond(question: string, ctx: AgentRunContext): Promise<string> {
    const { runId, incidentId } = ctx;

    this.emitStatus(runId, incidentId, 'THINKING', 'Retrieving historical evidence...');

    const histContext = this.historicalContext.length > 0
      ? `HISTORICAL DATABASE:\n` + this.historicalContext.slice(0, 10).map(h => `${h.title} (${h.year}): ${h.summary}`).join('\n')
      : 'No historical data available.';

    const userPrompt = [
      '=== NEXUS QUESTION ===',
      question,
      '',
      '=== INCIDENT ===',
      JSON.stringify(ctx.incident, null, 2),
      '',
      histContext,
      '',
      'Answer with the most relevant historical evidence. Be specific about years and locations. 2-3 sentences.',
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

  private fallbackOutput(): ArchiveOutput {
    return {
      historical_matches: [],
      recommended_actions: ['Apply standard response protocol for incident type'],
      warnings: [],
      tiebreak_support: undefined,
      confidence: 0.4,
      no_precedent: true,
    };
  }
}
