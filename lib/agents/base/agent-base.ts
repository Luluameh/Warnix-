// lib/agents/base/agent-base.ts
// Abstract base class for all Warnix agents.
// Provides: memory access, Qwen calls, SSE emission, timeline writing, shared memory writing.

import { randomUUID } from 'crypto';
import { callQwen, buildMessages, type QwenCallOptions } from '@/lib/qwen/client';
import { extractJSON } from '@/lib/qwen/parse';
import { shortTermMemory } from '@/lib/memory/short-term-memory';
import { sharedMemory } from '@/lib/memory/shared-memory';
import { sseRegistry } from '@/lib/sse/emitter';
import { SSE_EVENTS } from '@/lib/sse/types';
import { AGENT_META, type AgentId, type AgentRunContext, type AgentVoteResponse, MessageType } from '@/types';
import { prisma } from '@/lib/db/prisma';
import type { IAgent } from './agent-types';

export abstract class AgentBase implements IAgent {
  abstract readonly agentId: AgentId;
  abstract readonly systemPrompt: string;

  // ─── Abstract Methods ────────────────────────────────────────────────

  abstract run(ctx: AgentRunContext): Promise<AgentVoteResponse>;
  abstract respond(question: string, ctx: AgentRunContext): Promise<string>;

  // ─── Memory Helpers ───────────────────────────────────────────────────

  protected getShortTermMemory(limit = 5): string {
    return shortTermMemory.formatForPrompt(this.agentId, limit);
  }

  protected getSharedContext(runId: string): string {
    return sharedMemory.formatForPrompt(runId);
  }

  protected addMemory(
    incidentId: string,
    observation: string,
    confidence: number,
    tags: string[],
  ): void {
    shortTermMemory.add(this.agentId, { incidentId, observation, confidence, tags });
  }

  // ─── Qwen Call Wrapper ────────────────────────────────────────────────

  protected async callLLM<T>(
    userMessage: string,
    options: Omit<QwenCallOptions, 'agentId'> = { jsonMode: true },
  ): Promise<T> {
    const raw = await callQwen(
      buildMessages(this.systemPrompt, userMessage),
      { ...options, agentId: this.agentId },
    );
    return extractJSON<T>(raw, this.agentId);
  }

  protected async callLLMText(
    userMessage: string,
  ): Promise<string> {
    return callQwen(
      buildMessages(this.systemPrompt, userMessage),
      { agentId: this.agentId, jsonMode: false },
    );
  }

  // ─── SSE Emission Helpers ─────────────────────────────────────────────

  protected emitStatus(
    runId: string,
    incidentId: string,
    status: string,
    message?: string,
  ): void {
    sseRegistry.emitEvent(runId, incidentId, SSE_EVENTS.AGENT_STATUS, this.agentId, 1, {
      agentId: this.agentId,
      status,
      message,
    });
  }

  protected emitThinking(runId: string, incidentId: string, round: 1 | 2 = 1): void {
    sseRegistry.emitEvent(runId, incidentId, SSE_EVENTS.AGENT_THINKING, this.agentId, round, {
      agentId: this.agentId,
      message: `${AGENT_META[this.agentId].name} is analyzing...`,
    });
  }

  protected emitReasoning(
    runId: string,
    incidentId: string,
    reasoning: string,
    confidence: number,
    urgency: number,
    round: 1 | 2 = 1,
  ): void {
    sseRegistry.emitEvent(runId, incidentId, SSE_EVENTS.AGENT_REASONING, this.agentId, round, {
      agentId: this.agentId,
      reasoning,
      confidence,
      urgency,
    });
  }

  protected emitDebateMessage(
    runId: string,
    incidentId: string,
    messageType: string,
    content: string,
    round: 1 | 2 = 1,
    toAgent?: AgentId,
    evidenceTier?: 1 | 2 | 3,
  ): void {
    const id = randomUUID();
    const eventType =
      messageType === MessageType.CHALLENGE ? SSE_EVENTS.DEBATE_CHALLENGE :
      messageType === MessageType.EVIDENCE  ? SSE_EVENTS.DEBATE_EVIDENCE  :
      messageType === MessageType.REVISION  ? SSE_EVENTS.DEBATE_REVISION  :
      messageType === MessageType.RULING    ? SSE_EVENTS.DEBATE_RULING    :
      SSE_EVENTS.DEBATE_STATEMENT;

    // Emit via SSE
    sseRegistry.emitEvent(runId, incidentId, eventType, this.agentId, round, {
      id,
      fromAgent: this.agentId,
      toAgent,
      messageType,
      content,
      evidenceTier,
      round,
    });

    // Persist to database
    prisma.agentMessage.create({
      data: {
        id,
        agentRunId: runId,
        incidentId,
        fromAgent: this.agentId,
        toAgent: toAgent ?? null,
        messageType,
        content,
        round,
        evidenceTier: evidenceTier ?? null,
      },
    }).catch(err => {
      console.error('Failed to log agent debate message to database:', err);
    });
  }

  protected emitVote(
    runId: string,
    incidentId: string,
    vote: AgentVoteResponse,
    round: 1 | 2 = 1,
  ): void {
    sseRegistry.emitEvent(runId, incidentId, SSE_EVENTS.ROUND_1_VOTE, this.agentId, round, {
      agentId: this.agentId,
      confidence: vote.confidence,
      urgency: vote.urgency,
      vote: vote.vote,
      recommendation: vote.recommendation,
      reasoning: vote.reasoning,
      risks: vote.detectedRisks,
    });
  }

  protected emitSharedMemoryWrite(
    runId: string,
    incidentId: string,
    operation: string,
    data: Record<string, unknown>,
  ): void {
    sseRegistry.emitEvent(runId, incidentId, SSE_EVENTS.SHARED_MEMORY_WRITE, this.agentId, 1, {
      operation,
      agentId: this.agentId,
      data,
    });
  }

  protected emitTimeline(
    runId: string,
    incidentId: string,
    category: string,
    title: string,
    detail: string,
    severity: 'INFO' | 'WARNING' | 'CRITICAL' = 'INFO',
  ): void {
    sseRegistry.emitEvent(runId, incidentId, SSE_EVENTS.TIMELINE_ENTRY, this.agentId, 1, {
      agentId: this.agentId,
      category,
      title,
      detail,
      severity,
      timestamp: new Date().toISOString(),
    });

    // Persist timeline entry to PostgreSQL database
    prisma.timelineEntry.create({
      data: {
        incidentId,
        agentId: this.agentId,
        category,
        title,
        detail,
        severity,
      },
    }).catch(err => console.error(`Failed to persist timeline entry from agent ${this.agentId}:`, err));
  }

  // ─── Shared Memory Write Helpers ──────────────────────────────────────

  protected writeFactToSharedMemory(
    runId: string,
    incidentId: string,
    claim: string,
    tier: 1 | 2 | 3,
  ): void {
    const fact = sharedMemory.addFact(runId, this.agentId, claim, tier, 'DISPUTED');
    this.emitSharedMemoryWrite(runId, incidentId, 'add_fact', {
      factId: fact.id,
      claim,
      tier,
      agentId: this.agentId,
    });
  }

  protected writeEvidenceToSharedMemory(
    runId: string,
    incidentId: string,
    content: string,
    tier: 1 | 2 | 3,
    source: string,
  ): void {
    const evidence = sharedMemory.addEvidence(runId, this.agentId, content, tier, source);
    this.emitSharedMemoryWrite(runId, incidentId, 'add_evidence', {
      evidenceId: evidence.id,
      content,
      tier,
      source,
      agentId: this.agentId,
    });
  }

  protected openConflictInSharedMemory(
    runId: string,
    incidentId: string,
    withAgent: AgentId,
    claim: string,
  ): void {
    const conflict = sharedMemory.openConflict(runId, [this.agentId, withAgent], claim);
    this.emitSharedMemoryWrite(runId, incidentId, 'open_conflict', {
      conflictId: conflict.id,
      between: [this.agentId, withAgent],
      claim,
    });
    sseRegistry.emitEvent(runId, incidentId, SSE_EVENTS.SHARED_MEMORY_CONFLICT, this.agentId, 1, {
      conflictId: conflict.id,
      between: [this.agentId, withAgent],
      claim,
    });
  }

  // ─── Build Standard User Prompt ───────────────────────────────────────

  protected buildUserPrompt(ctx: AgentRunContext, extraContext?: string): string {
    const parts: string[] = [
      '=== INCIDENT ===',
      JSON.stringify(ctx.incident, null, 2),
      '',
      '=== YOUR SHORT-TERM MEMORY ===',
      this.getShortTermMemory(),
      '',
      '=== SHARED INCIDENT CONTEXT ===',
      this.getSharedContext(ctx.runId),
    ];

    if (extraContext) {
      parts.push('', '=== ADDITIONAL CONTEXT ===', extraContext);
    }

    if (ctx.humanOverride) {
      parts.push('', '=== HUMAN COMMANDER OVERRIDE ===', `"${ctx.humanOverride}"`);
    }

    parts.push('', '=== TASK ===', 'Analyze the incident above and output your structured JSON response per your schema.');

    return parts.join('\n');
  }
}
