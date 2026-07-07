// lib/orchestrator/negotiation-engine.ts
// Coordinates Round 2 targeted questioning.
// Interrogates low confidence agents, resolves disputes, matches historical precedents.

import { prisma } from '@/lib/db/prisma';
import type { AgentId, AgentRunContext } from '@/types';
import { sseRegistry } from '@/lib/sse/emitter';
import { EVENTS } from '@/lib/sse/types';
import type { IAgent } from '@/lib/agents/base/agent-types';

export class NegotiationEngine {
  constructor(private agents: Map<AgentId, IAgent>) {}

  /**
   * Run targeted sequential questioning for agents prompted by NEXUS.
   */
  async runNegotiationRound(
    ctx: AgentRunContext,
    questions: Array<{ to: AgentId; question: string; triggered_by: string }>,
  ): Promise<Array<{ agentId: AgentId; question: string; answer: string }>> {
    const { runId, incidentId } = ctx;
    const results: Array<{ agentId: AgentId; question: string; answer: string }> = [];

    if (questions.length === 0) return [];

    sseRegistry.emitEvent(runId, incidentId, EVENTS.ROUND_2_START, 'SYSTEM', 2, {
      questionCount: questions.length,
    });

    for (const q of questions) {
      const agent = this.agents.get(q.to);
      if (!agent) continue;

      // Log question to DB
      const record = await prisma.negotiationRound.create({
        data: {
          agentRunId: runId,
          question: q.question,
          askedBy: 'NEXUS',
          askedTo: q.to,
        },
      });

      // Emit SSE question event
      sseRegistry.emitEvent(runId, incidentId, EVENTS.NEGOTIATION_QUESTION, 'NEXUS', 2, {
        id: record.id,
        toAgent: q.to,
        question: q.question,
        triggeredBy: q.triggered_by,
      });

      // Force agent status thinking
      sseRegistry.emitEvent(runId, incidentId, EVENTS.AGENT_STATUS, q.to, 2, {
        agentId: q.to,
        status: 'THINKING',
        message: `Answering NEXUS query: ${q.question.slice(0, 40)}...`,
      });

      // Call agent response (runs Qwen)
      let answer = 'No response provided.';
      try {
        answer = await agent.respond(q.question, { ...ctx, round: 2 });
      } catch (err) {
        answer = `Error generating response: ${err instanceof Error ? err.message : String(err)}`;
      }

      // Save answer in DB
      await prisma.negotiationRound.update({
        where: { id: record.id },
        data: {
          answer,
          answeredAt: new Date(),
        },
      });

      // Emit SSE answer event
      sseRegistry.emitEvent(runId, incidentId, EVENTS.NEGOTIATION_ANSWER, q.to, 2, {
        id: record.id,
        agentId: q.to,
        question: q.question,
        answer,
      });

      results.push({ agentId: q.to, question: q.question, answer });

      // Delay briefly to allow human operators to watch the flow (NASA control style)
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    sseRegistry.emitEvent(runId, incidentId, EVENTS.NEGOTIATION_RESOLVED, 'SYSTEM', 2, {
      resolvedCount: results.length,
    });

    return results;
  }
}
