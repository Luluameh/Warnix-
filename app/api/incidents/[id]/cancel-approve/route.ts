// app/api/incidents/[id]/cancel-approve/route.ts
// POST /api/incidents/[id]/cancel-approve - Commander approves citizen cancellation request.

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

      if (!incident.citizenReportId) {
        throw new Error('No citizen report linked to this incident.');
      }

      // Find pending cancellation request
      const activeRequest = await tx.cancellationRequest.findFirst({
        where: { citizenReportId: incident.citizenReportId, status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
      });

      if (!activeRequest) {
        throw new Error('No pending cancellation request found.');
      }

      // Update request status
      await tx.cancellationRequest.update({
        where: { id: activeRequest.id },
        data: { status: 'APPROVED', resolvedAt: new Date() },
      });

      // Update incident status to WITHDRAWN
      const oldStatus = incident.status;
      const newStatus = 'WITHDRAWN';

      const updatedIncident = await tx.incident.update({
        where: { id },
        data: { status: newStatus },
      });

      // Release any active resources
      const incidentResources = await tx.incidentResource.findMany({
        where: { incidentId: id, status: { in: ['PENDING', 'EN_ROUTE', 'ARRIVED'] } },
      });

      for (const ir of incidentResources) {
        await tx.incidentResource.update({
          where: { id: ir.id },
          data: { status: 'RECALLED', completedAt: new Date() },
        });

        await tx.resource.update({
          where: { id: ir.resourceId },
          data: { status: 'AVAILABLE' },
        });
      }

      // Log timeline entry
      await tx.timelineEntry.create({
        data: {
          incidentId: id,
          agentId: 'COMMANDER',
          category: 'HUMAN',
          title: 'Cancellation APPROVED by Commander',
          detail: `Commander approved cancellation request. Status set to WITHDRAWN. Resources returned to base.`,
          severity: 'INFO',
        },
      });

      // Audit Log
      await AuditQueries.log({
        category: 'COMMANDER',
        action: 'APPROVE_CANCELLATION',
        performedBy: 'COMMANDER',
        details: `Approved citizen cancellation request. Releasing assets.`,
        apiRoute: `/api/incidents/${id}/cancel-approve`,
        incidentId: id,
        oldStatus,
        newStatus,
        metadata: { cancellationRequestId: activeRequest.id },
      });

      return { updatedIncident, activeRequestId: activeRequest.id };
    });

    sseRegistry.emitEvent('', id, EVENTS.CANCELLATION_DECIDED, 'COMMANDER', 2, {
      incidentId: id,
      decision: 'APPROVED',
      cancellationRequestId: result.activeRequestId,
      message: 'Incident commander approved citizen cancellation request.',
    });

    sseRegistry.emitEvent('', id, EVENTS.INCIDENT_STATUS_CHANGED, 'COMMANDER', 2, {
      incidentId: id,
      oldStatus: result.updatedIncident.status, // approximate
      newStatus: 'WITHDRAWN',
    });

    return NextResponse.json({ incident: result.updatedIncident });
  } catch (err) {
    return NextResponse.json(
      { error: `Approve cancellation handler failure: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 },
    );
  }
}
