// app/api/incidents/[id]/override/route.ts
// POST /api/incidents/[id]/override - Commander overrides the society decision and triggers agent re-run with explicit instruction.

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { RunManager } from '@/lib/orchestrator/run-manager';
import { sseRegistry } from '@/lib/sse/emitter';
import { EVENTS } from '@/lib/sse/types';
import { AuditQueries } from '@/lib/db/queries/audit';

export const runtime = 'nodejs';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const instruction = body.instruction;

    if (!instruction) {
      return NextResponse.json({ error: 'Missing override instruction' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const incident = await tx.incident.findUnique({
        where: { id },
      });

      if (!incident) {
        throw new Error('Incident not found');
      }

      // Valid source states: UNDER_REVIEW, ROUND_1_DEBATE, ROUND_2_DEBATE, AWAITING_COMMANDER
      const allowedStates = ['UNDER_REVIEW', 'ROUND_1_DEBATE', 'ROUND_2_DEBATE', 'AWAITING_COMMANDER', 'NEW', 'ACTIVE'];
      if (!allowedStates.includes(incident.status)) {
        throw new Error(`Override cannot be applied in status: ${incident.status}`);
      }

      // Find any existing active/awaiting run to mark as overridden
      const priorRun = await tx.agentRun.findFirst({
        where: { incidentId: id, status: { in: ['RUNNING', 'ROUND_2', 'AWAITING_HUMAN'] } },
        orderBy: { startedAt: 'desc' },
      });

      let priorRunId: string | null = null;
      if (priorRun) {
        priorRunId = priorRun.id;
        await tx.agentRun.update({
          where: { id: priorRun.id },
          data: { status: 'OVERRIDDEN', completedAt: new Date() },
        });
      }

      // Transition to ROUND_1_DEBATE for re-deliberation
      const oldStatus = incident.status;
      const newStatus = 'ROUND_1_DEBATE';

      const updatedIncident = await tx.incident.update({
        where: { id },
        data: { status: newStatus },
      });

      // Log commander intervention to timeline
      await tx.timelineEntry.create({
        data: {
          incidentId: id,
          agentId: 'COMMANDER',
          category: 'HUMAN',
          title: 'COMMANDER OVERRIDE INJECTED',
          detail: `Instruction: "${instruction}". Re-running agent society deliberation...`,
          severity: 'CRITICAL',
        },
      });

      // Audit Log
      await AuditQueries.log({
        category: 'COMMANDER',
        action: 'OVERRIDE_AI',
        performedBy: 'COMMANDER',
        details: `Commander injected custom instruction: "${instruction}". Reverting status from ${oldStatus} to ${newStatus}.`,
        apiRoute: `/api/incidents/${id}/override`,
        incidentId: id,
        oldStatus,
        newStatus,
        metadata: { instruction, priorRunId },
      });

      return { updatedIncident, priorRunId };
    });

    if (result.priorRunId) {
      // Emit SSE notify that previous run was overridden
      sseRegistry.emitEvent(result.priorRunId, id, EVENTS.HUMAN_OVERRIDE, 'COMMANDER', 2, {
        message: 'Previous run overridden by Commander instruction.',
        instruction,
      });
    }

    // Start a new agent run with the override instruction injected into context
    const newRun = await RunManager.startRun(id, instruction);

    // Emit SSE event for incident status change
    sseRegistry.emitEvent(newRun.id, id, EVENTS.INCIDENT_STATUS_CHANGED, 'COMMANDER', 1, {
      incidentId: id,
      oldStatus: result.updatedIncident.status === 'ROUND_1_DEBATE' ? 'UNDER_REVIEW' : 'AWAITING_COMMANDER', // approximate
      newStatus: 'ROUND_1_DEBATE',
    });

    sseRegistry.emitEvent(newRun.id, id, EVENTS.COMMANDER_ACTION, 'COMMANDER', 1, {
      action: 'OVERRIDE_AI',
      incidentId: id,
      instruction,
    });

    return NextResponse.json({ runId: newRun.id, incident: result.updatedIncident });
  } catch (err) {
    return NextResponse.json(
      { error: `Override handler failure: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 },
    );
  }
}
