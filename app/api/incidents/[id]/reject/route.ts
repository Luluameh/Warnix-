// app/api/incidents/[id]/reject/route.ts
// POST /api/incidents/[id]/reject - Incident Commander rejects the plan.

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { sseRegistry } from '@/lib/sse/emitter';
import { EVENTS } from '@/lib/sse/types';
import { AuditQueries } from '@/lib/db/queries/audit';

export const runtime = 'nodejs';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const result = await prisma.$transaction(async (tx) => {
      const incident = await tx.incident.findUnique({
        where: { id },
      });

      if (!incident) {
        throw new Error('Incident not found');
      }

      const activeRun = await tx.agentRun.findFirst({
        where: { incidentId: id, status: 'AWAITING_HUMAN' },
        orderBy: { startedAt: 'desc' },
      });

      if (!activeRun) {
        throw new Error('No run is currently awaiting human decision.');
      }

      // Update run status to FAILED
      const updatedRun = await tx.agentRun.update({
        where: { id: activeRun.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
        },
      });

      // Update incident status to UNDER_REVIEW
      const oldStatus = incident.status;
      const newStatus = 'UNDER_REVIEW';

      const updatedIncident = await tx.incident.update({
        where: { id },
        data: { status: newStatus },
      });

      // Log to EOC timeline
      await tx.timelineEntry.create({
        data: {
          incidentId: id,
          agentId: 'COMMANDER',
          category: 'HUMAN',
          title: 'EOC Response Plan REJECTED',
          detail: 'Plan rejected by Incident Commander. Action plan reverted to under review state.',
          severity: 'CRITICAL',
        },
      });

      // Audit Log
      await AuditQueries.log({
        category: 'COMMANDER',
        action: 'REJECT_PLAN',
        performedBy: 'COMMANDER',
        details: `Rejected AI response plan for incident: "${incident.title}". Reverting status from ${oldStatus} to ${newStatus}.`,
        apiRoute: `/api/incidents/${id}/reject`,
        incidentId: id,
        oldStatus,
        newStatus,
      });

      return { updatedIncident, updatedRun };
    });

    sseRegistry.emitEvent(result.updatedRun.id, id, EVENTS.HUMAN_REJECTED, 'COMMANDER', 2, {
      message: 'Incident commander rejected response plan.',
    });

    sseRegistry.emitEvent(result.updatedRun.id, id, EVENTS.RUN_COMPLETE, 'SYSTEM', 2, {
      runId: result.updatedRun.id,
      incidentId: id,
      status: 'FAILED',
    });

    sseRegistry.emitEvent(result.updatedRun.id, id, EVENTS.INCIDENT_STATUS_CHANGED, 'COMMANDER', 2, {
      incidentId: id,
      oldStatus: 'AWAITING_COMMANDER',
      newStatus: 'UNDER_REVIEW',
    });

    sseRegistry.emitEvent(result.updatedRun.id, id, EVENTS.COMMANDER_ACTION, 'COMMANDER', 2, {
      action: 'REJECT_PLAN',
      incidentId: id,
    });

    return NextResponse.json({ run: result.updatedRun, incident: result.updatedIncident });
  } catch (err) {
    return NextResponse.json(
      { error: `Rejection handler failure: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 },
    );
  }
}
