// app/api/incidents/[id]/cancel-request/route.ts
// POST /api/incidents/[id]/cancel-request - Citizen submits a Cancellation Request (since status is past NEW).

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { sseRegistry } from '@/lib/sse/emitter';
import { EVENTS } from '@/lib/sse/types';
import { AuditQueries } from '@/lib/db/queries/audit';

export const runtime = 'nodejs';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const reason = body.reason || 'No reason provided';

    const result = await prisma.$transaction(async (tx) => {
      const incident = await tx.incident.findUnique({
        where: { id },
      });

      if (!incident) {
        throw new Error('Incident not found');
      }

      if (incident.status === 'NEW' || incident.status === 'WITHDRAWN' || incident.status === 'ARCHIVED') {
        throw new Error(`Cancellation request cannot be submitted in status: ${incident.status}`);
      }

      // Ensure citizenReport link exists, otherwise create it mock-wise to capture request
      let citizenReportId = incident.citizenReportId;
      if (!citizenReportId) {
        const citizenReport = await tx.citizenReport.create({
          data: {
            title: incident.title,
            type: incident.type,
            description: incident.description,
            severity: incident.severity,
            location: incident.location,
            latitude: incident.latitude,
            longitude: incident.longitude,
            status: incident.status,
          },
        });
        citizenReportId = citizenReport.id;
        await tx.incident.update({
          where: { id },
          data: { citizenReportId },
        });
      }

      // Create cancellation request
      const cancelReq = await tx.cancellationRequest.create({
        data: {
          citizenReportId: citizenReportId!,
          status: 'PENDING',
          reason,
        },
      });

      // Log to EOC timeline
      await tx.timelineEntry.create({
        data: {
          incidentId: id,
          agentId: 'CITIZEN',
          category: 'UPDATE',
          title: 'Cancellation Request Submitted',
          detail: `Citizen submitted cancellation request. Reason: "${reason}". Pending Commander decision.`,
          severity: 'WARNING',
        },
      });

      // Audit Log
      await AuditQueries.log({
        category: 'USER',
        action: 'SUBMIT_CANCELLATION_REQUEST',
        performedBy: 'CITIZEN',
        details: `Submitted cancellation request. Reason: "${reason}".`,
        apiRoute: `/api/incidents/${id}/cancel-request`,
        incidentId: id,
        oldStatus: incident.status,
        newStatus: incident.status, // no immediate change until commander decides
        metadata: { cancellationRequestId: cancelReq.id, reason },
      });

      return { cancelReq, status: incident.status };
    });

    sseRegistry.emitEvent('', id, EVENTS.CANCELLATION_REQUESTED, 'CITIZEN', 2, {
      incidentId: id,
      reason,
      cancellationRequestId: result.cancelReq.id,
      message: 'Citizen requested cancellation of active operation.',
    });

    return NextResponse.json({ success: true, cancellationRequest: result.cancelReq });
  } catch (err) {
    return NextResponse.json(
      { error: `Cancellation submission handler failure: ${err instanceof Error ? err.message : String(err)}` },
      { status: 400 },
    );
  }
}
