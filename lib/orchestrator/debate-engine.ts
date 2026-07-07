// lib/orchestrator/debate-engine.ts
// Enforces formal debate structure between agents: STATEMENT → CHALLENGE → EVIDENCE → REVISION → RULING.

import { prisma } from '@/lib/db/prisma';
import type { AgentId, MessageType } from '@/types';
import type { AgentSSEEvent, SSEEventType } from '@/lib/sse/types';
import { sseRegistry } from '@/lib/sse/emitter';
import { eventBus } from './event-bus';
import { EVENTS } from '@/lib/sse/types';

export class DebateEngine {
  /**
   * Log an agent's debate message to both PostgreSQL (for persistence) and SSE (realtime client delivery).
   */
  static async logMessage(params: {
    runId: string;
    incidentId: string;
    fromAgent: AgentId | 'SYSTEM' | 'HUMAN';
    toAgent?: AgentId;
    messageType: string;
    content: string;
    reasoning?: string;
    evidenceTier?: number;
    round: 1 | 2;
  }): Promise<void> {
    const msg = await prisma.agentMessage.create({
      data: {
        agentRunId: params.runId,
        incidentId: params.incidentId,
        fromAgent: params.fromAgent,
        toAgent: params.toAgent ?? null,
        messageType: params.messageType,
        content: params.content,
        reasoning: params.reasoning ?? null,
        evidenceTier: params.evidenceTier ?? null,
        round: params.round,
      },
    });

    // Determine target SSE event type based on debate message type
    let sseType: SSEEventType = EVENTS.DEBATE_STATEMENT;
    if (params.messageType === 'CHALLENGE') sseType = EVENTS.DEBATE_CHALLENGE;
    else if (params.messageType === 'EVIDENCE') sseType = EVENTS.DEBATE_EVIDENCE;
    else if (params.messageType === 'REVISION') sseType = EVENTS.DEBATE_REVISION;
    else if (params.messageType === 'RULING') sseType = EVENTS.DEBATE_RULING;

    // Send via SSE
    sseRegistry.emitEvent(
      params.runId,
      params.incidentId,
      sseType,
      params.fromAgent,
      params.round,
      {
        id: msg.id,
        fromAgent: params.fromAgent,
        toAgent: params.toAgent,
        messageType: params.messageType,
        content: params.content,
        reasoning: params.reasoning,
        evidenceTier: params.evidenceTier,
        round: params.round,
        timestamp: msg.timestamp.toISOString(),
      },
    );

    // Push into the Event Bus for system-level async notifications
    eventBus.publish(
      params.runId,
      sseType,
      params.fromAgent,
      params.incidentId,
      params.round,
      {
        id: msg.id,
        fromAgent: params.fromAgent,
        toAgent: params.toAgent,
        messageType: params.messageType,
        content: params.content,
        reasoning: params.reasoning,
        evidenceTier: params.evidenceTier,
        round: params.round,
      },
    );
  }

  /**
   * List all debate messages for an incident run.
   */
  static async getMessages(runId: string) {
    return prisma.agentMessage.findMany({
      where: { agentRunId: runId },
      orderBy: { timestamp: 'asc' },
    });
  }
}
