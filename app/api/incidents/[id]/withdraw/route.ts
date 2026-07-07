// app/api/incidents/[id]/withdraw/route.ts
// POST /api/incidents/[id]/withdraw - Citizen withdraws their own report (valid only if NEW).

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

      if (incident.status !== 'NEW') {
        throw new Error(`Incident in status ${incident.status} cannot be withdrawn directly. Please request cancellation instead.`);
      }

      const oldStatus = incident.status;
      const newStatus = 'WITHDRAWN';

      const updatedIncident = await tx.incident.update({
        where: { id },
        data: { status: newStatus },
      });

      // Update citizen report if link exists
      if (incident.citizenReportId) {
        await tx.citizenReport.update({
          where: { id: incident.citizenReportId },
          data: { status: 'WITHDRAWN' },
        });
      }

      // Create timeline entry
      await tx.timelineEntry.create({
        data: {
          incidentId: id,
          agentId: 'CITIZEN',
          category: 'REPORT',
          title: 'Citizen Report WITHDRAWN',
          detail: `Citizen report withdrawn by creator. Reason: "${reason}".`,
          severity: 'WARNING',
        },
      });

      // Audit Log
      await AuditQueries.log({
        category: 'USER',
        action: 'WITHDRAW_REPORT',
        performedBy: 'CITIZEN',
        details: `Citizen report withdrawn directly. Reason: "${reason}".`,
        apiRoute: `/api/incidents/${id}/withdraw`,
        incidentId: id,
        oldStatus,
        newStatus,
        metadata: { reason },
      });

      return { updatedIncident };
    });

    sseRegistry.emitEvent('', id, EVENTS.INCIDENT_WITHDRAWN, 'CITIZEN', 1, {
      incidentId: id,
      reason,
      message: 'Citizen report was withdrawn by reporter.',
    });

    sseRegistry.emitEvent('', id, EVENTS.INCIDENT_STATUS_CHANGED, 'CITIZEN', 1, {
      incidentId: id,
      oldStatus: 'NEW',
      newStatus: 'WITHDRAWN',
    });

    return NextResponse.json({ incident: result.updatedIncident });
  } catch (err) {
    return NextResponse.json(
      { error: `Withdraw handler failure: ${err instanceof Error ? err.message : String(err)}` },
      { status: 400 },
    );
  }
}
