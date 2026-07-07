// lib/agents/axiom.agent.ts
// AXIOM: Verification Agent — skeptical, Socratic, issues challenges.

import { AgentBase } from './base/agent-base';
import { AXIOM_SYSTEM_PROMPT } from './prompts/axiom.prompt';
import { callQwen, buildMessages } from '@/lib/qwen/client';
import { safeNumber, safeStringArray } from '@/lib/qwen/parse';
import {
  AgentId, VoteType, MessageType, TimelineCategory,
  type AgentRunContext, type AgentVoteResponse,
} from '@/types';
import { sseRegistry } from '@/lib/sse/emitter';
import { SSE_EVENTS } from '@/lib/sse/types';
import { sharedMemory } from '@/lib/memory/shared-memory';
import type { AxiomOutput } from './base/agent-types';

export class AxiomAgent extends AgentBase {
  readonly agentId = AgentId.AXIOM;
  readonly systemPrompt = AXIOM_SYSTEM_PROMPT;

  async run(ctx: AgentRunContext): Promise<AgentVoteResponse> {
    const { runId, incidentId, incident } = ctx;

    this.emitStatus(runId, incidentId, 'THINKING', 'Running consistency checks...');
    this.emitThinking(runId, incidentId);
    this.emitTimeline(runId, incidentId, TimelineCategory.ANALYSIS, '◈ AXIOM: Verification starting', '4-point consistency check in progress');

    const userPrompt = this.buildUserPrompt(ctx, [
      'Run all 4 consistency checks.',
      'List every unverified claim under disputed_claims.',
      'Issue challenges for claims that contradict physical reality or are sourced only from a single unverified report.',
      'Your believability_score should reflect how confident you are the incident is real and as described.',
    ].join('\n'));

    let output: AxiomOutput;
    try {
      output = await this.callLLM<AxiomOutput>(userPrompt);
    } catch {
      output = this.fallbackOutput();
    }

    const confidence = safeNumber(output as unknown as Record<string, unknown>, 'confidence', 0.65);
    const urgency    = safeNumber(output as unknown as Record<string, unknown>, 'urgency', 0.6);
    const challenges = output.challenges ?? [];

    // Emit challenges to debate
    for (const challenge of challenges) {
      const targetAgent = challenge.target_agent as AgentId;
      const challengeText = `CHALLENGE ${targetAgent}: '${challenge.claim}' — ${challenge.reason}`;

      this.emitDebateMessage(runId, incidentId, MessageType.CHALLENGE, challengeText, 1, targetAgent);
      this.openConflictInSharedMemory(runId, incidentId, targetAgent, challenge.claim);

      this.emitTimeline(runId, incidentId, TimelineCategory.CHALLENGE,
        `◈ AXIOM → ${targetAgent}: Challenge issued`,
        challengeText,
        'WARNING',
      );
    }

    // Emit verified claims to shared memory
    for (const claim of (output.verified_claims ?? []).slice(0, 3)) {
      this.writeFactToSharedMemory(runId, incidentId, claim, 2);
    }

    // Emit duplicate risk warning
    const dupRisk = safeNumber(output as unknown as Record<string, unknown>, 'duplicate_risk', 0);
    if (dupRisk > 0.5) {
      sseRegistry.emitEvent(runId, incidentId, SSE_EVENTS.DEBATE_STATEMENT, this.agentId, 1, {
        fromAgent: this.agentId,
        messageType: MessageType.STATEMENT,
        content: `HIGH DUPLICATE RISK: ${Math.round(dupRisk * 100)}% probability this is a duplicate report.`,
        round: 1,
      });
    }

    // Main statement
    const believability = safeNumber(output as unknown as Record<string, unknown>, 'believability_score', 0.6);
    this.emitDebateMessage(runId, incidentId, MessageType.STATEMENT,
      `Verification complete. Believability: ${Math.round(believability * 100)}%. ` +
      `${challenges.length} challenge(s) issued. ` +
      `${(output.verified_claims ?? []).length} claim(s) verified.`,
    );

    this.emitReasoning(runId, incidentId,
      `Believability score: ${Math.round(believability * 100)}%. ` +
      `${challenges.length > 0 ? `Challenged: ${challenges.map(c => `'${c.claim}'`).join(', ')}.` : 'No major inconsistencies found.'} ` +
      `${output.verified_claims?.length ? `Verified: ${output.verified_claims[0]}.` : ''}`,
      confidence, urgency,
    );

    this.addMemory(incidentId,
      `Verification: believability ${Math.round(believability * 100)}%, ${challenges.length} challenges, dup risk ${Math.round(dupRisk * 100)}%`,
      confidence,
      [incident.type.toLowerCase(), 'verification', dupRisk > 0.4 ? 'duplicate-risk' : 'verified'],
    );

    this.emitTimeline(runId, incidentId, TimelineCategory.ANALYSIS,
      `◈ AXIOM: Believability ${Math.round(believability * 100)}%`,
      `${(output.disputed_claims ?? []).length} disputed · ${challenges.length} challenges issued`,
      confidence < 0.6 ? 'WARNING' : 'INFO',
    );

    this.emitStatus(runId, incidentId, 'DONE', `${challenges.length} challenge(s) issued`);

    const vote =
      believability >= 0.75 && challenges.length === 0 ? VoteType.AGREE :
      believability >= 0.5 ? VoteType.PARTIAL :
      VoteType.DISAGREE;

    const voteResponse: AgentVoteResponse = {
      agentId: this.agentId,
      confidence,
      urgency,
      vote,
      recommendation: challenges.length > 0
        ? `Resolve ${challenges.length} challenge(s) before deploying resources`
        : 'Incident verified — proceed with response',
      reasoning: `Believability ${Math.round(believability * 100)}%. ` +
        `${challenges.length > 0 ? `${challenges.length} unresolved challenge(s).` : 'No major inconsistencies.'}`,
      detectedRisks: safeStringArray(output as unknown as Record<string, unknown>, 'risks'),
      agreesWith: [],
      disagreesWith: challenges.map(c => c.target_agent as AgentId),
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

    const userPrompt = [
      '=== NEXUS QUESTION FOR YOU ===',
      question,
      '',
      '=== INCIDENT ===',
      JSON.stringify(ctx.incident, null, 2),
      '',
      '=== SHARED CONTEXT ===',
      this.getSharedContext(runId),
      '',
      'Answer with precision. Identify the specific claim or data point that is unverified. 2-3 sentences.',
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

  private fallbackOutput(): AxiomOutput {
    return {
      verified_claims: [],
      disputed_claims: ['All claims require verification'],
      challenges: [],
      duplicate_risk: 0.2,
      believability_score: 0.6,
      confidence: 0.5,
      urgency: 0.5,
      risks: ['Unable to complete full verification'],
      recommendation: 'Perform secondary verification.',
      memory_influence: null,
    };
  }
}
