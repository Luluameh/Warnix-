// app/api/incidents/[id]/recall/route.ts
// POST /api/incidents/[id]/recall - Commander recalls dispatched resources.

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

      // State validation: DISPATCHED, ACTIVE
      if (incident.status !== 'DISPATCHED' && incident.status !== 'ACTIVE') {
        throw new Error(`Cannot recall resources while in status: ${incident.status}`);
      }

      // Update incident status to CONTAINED
      const oldStatus = incident.status;
      const newStatus = 'CONTAINED';

      const updatedIncident = await tx.incident.update({
        where: { id },
        data: { status: newStatus },
      });

      // Find all active incident resources deployed to recall them
      const incidentResources = await tx.incidentResource.findMany({
        where: { incidentId: id, status: { in: ['PENDING', 'EN_ROUTE', 'ARRIVED'] } },
      });

      const recalledCallSigns: string[] = [];

      for (const ir of incidentResources) {
        // Mark deployment as recalled
        await tx.incidentResource.update({
          where: { id: ir.id },
          data: { status: 'RECALLED', completedAt: new Date() },
        });

        // Set resource back to AVAILABLE
        const updatedResource = await tx.resource.update({
          where: { id: ir.resourceId },
          data: { status: 'AVAILABLE' },
        });

        recalledCallSigns.push(updatedResource.callSign);

        // Timeline Entry
        await tx.timelineEntry.create({
          data: {
            incidentId: id,
            agentId: 'COMMANDER',
            category: 'DEPLOYMENT',
            title: `Resource Recalled: ${updatedResource.name}`,
            detail: `Callsign ${updatedResource.callSign} ordered back to home base by EOC commander.`,
            severity: 'WARNING',
          },
        });
      }

      // Commander timeline entry
      await tx.timelineEntry.create({
        data: {
          incidentId: id,
          agentId: 'COMMANDER',
          category: 'HUMAN',
          title: 'COMMANDER RECALLED ALL RESOURCES',
          detail: `Recall order completed for resources: ${recalledCallSigns.join(', ') || 'none'}. Incident response state reverted to CONTAINED.`,
          severity: 'CRITICAL',
        },
      });

      // Audit Log
      await AuditQueries.log({
        category: 'COMMANDER',
        action: 'RECALL_RESOURCES',
        performedBy: 'COMMANDER',
        details: `Commander recalled all resources for incident: "${incident.title}".`,
        apiRoute: `/api/incidents/${id}/recall`,
        incidentId: id,
        oldStatus,
        newStatus,
        metadata: { recalledResources: recalledCallSigns },
      });

      return { updatedIncident, recalledCallSigns };
    });

    // SSE alerts
    sseRegistry.emitEvent('', id, EVENTS.RESOURCE_RECALLED, 'COMMANDER', 2, {
      message: 'Incident commander ordered a global recall of resources.',
      recalledCount: result.recalledCallSigns.length,
      recalledCallSigns: result.recalledCallSigns,
    });

    sseRegistry.emitEvent('', id, EVENTS.INCIDENT_STATUS_CHANGED, 'COMMANDER', 2, {
      incidentId: id,
      oldStatus: 'DISPATCHED',
      newStatus: 'CONTAINED',
    });

    sseRegistry.emitEvent('', id, EVENTS.COMMANDER_ACTION, 'COMMANDER', 2, {
      action: 'RECALL_RESOURCES',
      incidentId: id,
    });

    return NextResponse.json({ incident: result.updatedIncident, recalled: result.recalledCallSigns });
  } catch (err) {
    return NextResponse.json(
      { error: `Recall handler failure: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 },
    );
  }
}
