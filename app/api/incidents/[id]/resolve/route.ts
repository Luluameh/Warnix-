// app/api/incidents/[id]/resolve/route.ts
// POST /api/incidents/[id]/resolve - Commander marks the incident as resolved.

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

      // Valid source states: DISPATCHED, ACTIVE, CONTAINED
      const allowedStates = ['DISPATCHED', 'ACTIVE', 'CONTAINED', 'NEW', 'UNDER_REVIEW', 'ROUND_1_DEBATE', 'ROUND_2_DEBATE', 'AWAITING_COMMANDER'];
      if (!allowedStates.includes(incident.status)) {
        throw new Error(`Cannot resolve incident in status: ${incident.status}`);
      }

      const oldStatus = incident.status;
      const newStatus = 'RESOLVED';

      const updatedIncident = await tx.incident.update({
        where: { id },
        data: { status: newStatus },
      });

      // Release any leftover active resources
      const incidentResources = await tx.incidentResource.findMany({
        where: { incidentId: id, status: { in: ['PENDING', 'EN_ROUTE', 'ARRIVED'] } },
      });

      for (const ir of incidentResources) {
        await tx.incidentResource.update({
          where: { id: ir.id },
          data: { status: 'COMPLETED', completedAt: new Date() },
        });

        await tx.resource.update({
          where: { id: ir.resourceId },
          data: { status: 'AVAILABLE' },
        });
      }

      // Create timeline entry
      await tx.timelineEntry.create({
        data: {
          incidentId: id,
          agentId: 'COMMANDER',
          category: 'COMPLETION',
          title: 'Incident Declared RESOLVED',
          detail: 'Incident commander closed the response lifecycle. All units checked out and returned to normal status.',
          severity: 'INFO',
        },
      });

      // Audit Log
      await AuditQueries.log({
        category: 'COMMANDER',
        action: 'RESOLVE_INCIDENT',
        performedBy: 'COMMANDER',
        details: `Incident marked RESOLVED by commander. All resources returned.`,
        apiRoute: `/api/incidents/${id}/resolve`,
        incidentId: id,
        oldStatus,
        newStatus,
      });

      return { updatedIncident };
    });

    sseRegistry.emitEvent('', id, EVENTS.INCIDENT_STATUS_CHANGED, 'COMMANDER', 2, {
      incidentId: id,
      oldStatus: result.updatedIncident.status,
      newStatus: 'RESOLVED',
    });

    sseRegistry.emitEvent('', id, EVENTS.COMMANDER_ACTION, 'COMMANDER', 2, {
      action: 'RESOLVE_INCIDENT',
      incidentId: id,
    });

    return NextResponse.json({ incident: result.updatedIncident });
  } catch (err) {
    return NextResponse.json(
      { error: `Resolve handler failure: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 },
    );
  }
}
