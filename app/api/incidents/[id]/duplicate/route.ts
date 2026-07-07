// app/api/incidents/[id]/duplicate/route.ts
// POST /api/incidents/[id]/duplicate - Commander marks incident as duplicate of parent.

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { sseRegistry } from '@/lib/sse/emitter';
import { EVENTS } from '@/lib/sse/types';
import { AuditQueries } from '@/lib/db/queries/audit';

export const runtime = 'nodejs';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parentId = body.parentId; // Optional parent incident reference

    const result = await prisma.$transaction(async (tx) => {
      const incident = await tx.incident.findUnique({
        where: { id },
      });

      if (!incident) {
        throw new Error('Incident not found');
      }

      const oldStatus = incident.status;
      const newStatus = 'DUPLICATE';

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
          title: 'Incident marked DUPLICATE',
          detail: `Commander resolved incident as a duplicate${parentId ? ` of Incident: #${parentId}` : ''}. Logs preserved.`,
          severity: 'WARNING',
        },
      });

      // Audit Log
      await AuditQueries.log({
        category: 'COMMANDER',
        action: 'MARK_DUPLICATE',
        performedBy: 'COMMANDER',
        details: `Incident marked as DUPLICATE${parentId ? ` (Parent ID: ${parentId})` : ''}.`,
        apiRoute: `/api/incidents/${id}/duplicate`,
        incidentId: id,
        oldStatus,
        newStatus,
        metadata: { parentId },
      });

      return { updatedIncident };
    });

    sseRegistry.emitEvent('', id, EVENTS.INCIDENT_STATUS_CHANGED, 'COMMANDER', 2, {
      incidentId: id,
      oldStatus: result.updatedIncident.status,
      newStatus: 'DUPLICATE',
    });

    sseRegistry.emitEvent('', id, EVENTS.COMMANDER_ACTION, 'COMMANDER', 2, {
      action: 'MARK_DUPLICATE',
      incidentId: id,
      parentId,
    });

    return NextResponse.json({ incident: result.updatedIncident });
  } catch (err) {
    return NextResponse.json(
      { error: `Duplicate marking handler failure: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 },
    );
  }
}
