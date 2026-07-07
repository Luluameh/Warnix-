// app/api/incidents/[id]/archive/route.ts
// POST /api/incidents/[id]/archive - Commander archives resolved incident.

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

      // Valid source state: RESOLVED, FALSE_ALARM, DUPLICATE, WITHDRAWN
      const allowedStates = ['RESOLVED', 'FALSE_ALARM', 'DUPLICATE', 'WITHDRAWN', 'NEW', 'UNDER_REVIEW'];
      if (!allowedStates.includes(incident.status)) {
        throw new Error(`Cannot archive incident in status: ${incident.status}`);
      }

      const oldStatus = incident.status;
      const newStatus = 'ARCHIVED';

      const updatedIncident = await tx.incident.update({
        where: { id },
        data: { status: newStatus },
      });

      // Create timeline entry
      await tx.timelineEntry.create({
        data: {
          incidentId: id,
          agentId: 'COMMANDER',
          category: 'COMPLETION',
          title: 'Incident Record ARCHIVED',
          detail: 'Commander archived the historical operational logs. Incident marked read-only.',
          severity: 'INFO',
        },
      });

      // Audit Log
      await AuditQueries.log({
        category: 'COMMANDER',
        action: 'ARCHIVE_INCIDENT',
        performedBy: 'COMMANDER',
        details: `Incident record archived. Moved to historical logs.`,
        apiRoute: `/api/incidents/${id}/archive`,
        incidentId: id,
        oldStatus,
        newStatus,
      });

      return { updatedIncident };
    });

    sseRegistry.emitEvent('', id, EVENTS.INCIDENT_ARCHIVED, 'COMMANDER', 2, {
      incidentId: id,
      message: 'Incident archived and made read-only.',
    });

    sseRegistry.emitEvent('', id, EVENTS.INCIDENT_STATUS_CHANGED, 'COMMANDER', 2, {
      incidentId: id,
      oldStatus: result.updatedIncident.status,
      newStatus: 'ARCHIVED',
    });

    return NextResponse.json({ incident: result.updatedIncident });
  } catch (err) {
    return NextResponse.json(
      { error: `Archive handler failure: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 },
    );
  }
}
