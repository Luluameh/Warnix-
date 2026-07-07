// app/api/incidents/[id]/false-alarm/route.ts
// POST /api/incidents/[id]/false-alarm - Commander marks incident as false alarm.

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

      const oldStatus = incident.status;
      const newStatus = 'FALSE_ALARM';

      // Update incident status
      const updatedIncident = await tx.incident.update({
        where: { id },
        data: { status: newStatus },
      });

      // Create timeline entry
      await tx.timelineEntry.create({
        data: {
          incidentId: id,
          agentId: 'COMMANDER',
          category: 'HUMAN',
          title: 'Incident Declared FALSE ALARM',
          detail: 'Commander marked incident as a false alarm. Historical logs and evidence preserved.',
          severity: 'CRITICAL',
        },
      });

      // Audit Log
      await AuditQueries.log({
        category: 'COMMANDER',
        action: 'MARK_FALSE_ALARM',
        performedBy: 'COMMANDER',
        details: 'Incident declared a false alarm. Releasing any operational response.',
        apiRoute: `/api/incidents/${id}/false-alarm`,
        incidentId: id,
        oldStatus,
        newStatus,
      });

      return { updatedIncident };
    });

    sseRegistry.emitEvent('', id, EVENTS.INCIDENT_STATUS_CHANGED, 'COMMANDER', 2, {
      incidentId: id,
      oldStatus: result.updatedIncident.status,
      newStatus: 'FALSE_ALARM',
    });

    sseRegistry.emitEvent('', id, EVENTS.COMMANDER_ACTION, 'COMMANDER', 2, {
      action: 'MARK_FALSE_ALARM',
      incidentId: id,
    });

    return NextResponse.json({ incident: result.updatedIncident });
  } catch (err) {
    return NextResponse.json(
      { error: `False alarm handler failure: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 },
    );
  }
}
