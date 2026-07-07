// app/api/incidents/[id]/cancel-continue/route.ts
// POST /api/incidents/[id]/cancel-continue - Commander rejects cancellation request and continues investigation.

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

      // Update request status to CONTINUED
      await tx.cancellationRequest.update({
        where: { id: activeRequest.id },
        data: { status: 'CONTINUED', resolvedAt: new Date() },
      });

      // Maintain incident status, but make sure status is UNDER_REVIEW if it was NEW, etc.
      let oldStatus = incident.status;
      let newStatus = incident.status;

      // Log timeline entry
      await tx.timelineEntry.create({
        data: {
          incidentId: id,
          agentId: 'COMMANDER',
          category: 'HUMAN',
          title: 'Cancellation DENIED by Commander',
          detail: 'Commander denied the citizen cancellation request. Active EOC response operations will continue.',
          severity: 'WARNING',
        },
      });

      // Audit Log
      await AuditQueries.log({
        category: 'COMMANDER',
        action: 'CONTINUE_INVESTIGATION',
        performedBy: 'COMMANDER',
        details: 'Commander denied citizen cancellation request and ordered investigation to continue.',
        apiRoute: `/api/incidents/${id}/cancel-continue`,
        incidentId: id,
        oldStatus,
        newStatus,
        metadata: { cancellationRequestId: activeRequest.id },
      });

      return { updatedIncident: incident, activeRequestId: activeRequest.id };
    });

    sseRegistry.emitEvent('', id, EVENTS.CANCELLATION_DECIDED, 'COMMANDER', 2, {
      incidentId: id,
      decision: 'CONTINUED',
      cancellationRequestId: result.activeRequestId,
      message: 'Incident commander denied cancellation request. Investigation continues.',
    });

    return NextResponse.json({ incident: result.updatedIncident });
  } catch (err) {
    return NextResponse.json(
      { error: `Continue investigation handler failure: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 },
    );
  }
}
