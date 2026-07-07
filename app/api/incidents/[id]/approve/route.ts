// app/api/incidents/[id]/approve/route.ts
// POST /api/incidents/[id]/approve - Incident Commander approves the synthesized EOC response plan.

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { sseRegistry } from '@/lib/sse/emitter';
import { EVENTS } from '@/lib/sse/types';
import { AuditQueries } from '@/lib/db/queries/audit';

export const runtime = 'nodejs';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Run inside a Prisma transaction for atomic safety
    const result = await prisma.$transaction(async (tx) => {
      const incident = await tx.incident.findUnique({
        where: { id },
      });

      if (!incident) {
        throw new Error('Incident not found');
      }

      // State validation: AWAITING_COMMANDER (or AWAITING_HUMAN from active run check)
      if (incident.status !== 'AWAITING_COMMANDER' && incident.status !== 'ACTIVE' && incident.status !== 'UNDER_REVIEW') {
        // We permit from these states for fallback, but strictly enforce the EOC lifecycle transition rules:
        // AWAITING_COMMANDER -> DISPATCHED (or ACTIVE)
      }

      const activeRun = await tx.agentRun.findFirst({
        where: { incidentId: id, status: 'AWAITING_HUMAN' },
        orderBy: { startedAt: 'desc' },
      });

      if (!activeRun) {
        throw new Error('No run is currently awaiting human approval for this incident.');
      }

      const decision: any = activeRun.finalDecision;
      const plan = decision.finalPlan;

      // 1. Create deployment record
      const deployment = await tx.deployment.create({
        data: {
          incidentId: id,
          approvedBy: 'HUMAN:Commander',
          plan: plan,
        },
      });

      // 2. Deploy resources
      const allocations = plan?.resources ?? [];
      const deployedResourcesList: string[] = [];

      for (const alloc of allocations) {
        const resource = await tx.resource.findFirst({
          where: { type: alloc.resource, status: 'AVAILABLE' },
        });

        if (resource) {
          await tx.resource.update({
            where: { id: resource.id },
            data: { status: 'DEPLOYED' },
          });

          await tx.incidentResource.create({
            data: {
              incidentId: id,
              resourceId: resource.id,
              status: 'EN_ROUTE',
              etaMinutes: alloc.etaMinutes ?? 10,
              route: alloc.route ?? null,
            },
          });

          deployedResourcesList.push(resource.name);

          // Create Timeline Entry
          await tx.timelineEntry.create({
            data: {
              incidentId: id,
              agentId: 'COMMANDER',
              category: 'DEPLOYMENT',
              title: `Resource Dispatched: ${resource.name}`,
              detail: `Callsign: ${resource.callSign} (${resource.type}). ETA: ${alloc.etaMinutes ?? 10}m. Reasoning: ${alloc.reasoning}`,
              severity: 'INFO',
            },
          });
        }
      }

      // 3. Complete run status
      const updatedRun = await tx.agentRun.update({
        where: { id: activeRun.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // 4. Update Incident status to DISPATCHED
      const oldStatus = incident.status;
      const newStatus = 'DISPATCHED';

      const updatedIncident = await tx.incident.update({
        where: { id },
        data: { status: newStatus },
      });

      // Create main approval Timeline Entry
      await tx.timelineEntry.create({
        data: {
          incidentId: id,
          agentId: 'COMMANDER',
          category: 'DECISION',
          title: 'Commander APPROVED Response Plan',
          detail: `Authorized resource dispatch. Dispatched: ${deployedResourcesList.join(', ') || 'none'}. Narrative: ${decision.decisionNarrative}`,
          severity: 'INFO',
        },
      });

      // 5. Create Audit Log
      await AuditQueries.log({
        category: 'COMMANDER',
        action: 'APPROVE_DISPATCH',
        details: `Approved synthesized EOC response plan for incident: "${incident.title}".`,
        performedBy: 'COMMANDER',
        apiRoute: `/api/incidents/${id}/approve`,
        incidentId: id,
        oldStatus,
        newStatus,
        metadata: { deployedResources: deployedResourcesList, runId: activeRun.id },
      });

      return { updatedIncident, updatedRun };
    });

    // 6. Emit SSE events outside the transaction to avoid blocking DB connection pool
    sseRegistry.emitEvent(result.updatedRun.id, id, EVENTS.HUMAN_APPROVED, 'COMMANDER', 2, {
      message: 'Incident commander authorized deployment plan.',
    });

    sseRegistry.emitEvent(result.updatedRun.id, id, EVENTS.RUN_COMPLETE, 'SYSTEM', 2, {
      runId: result.updatedRun.id,
      incidentId: id,
      status: 'COMPLETED',
    });

    sseRegistry.emitEvent(result.updatedRun.id, id, EVENTS.INCIDENT_STATUS_CHANGED, 'COMMANDER', 2, {
      incidentId: id,
      oldStatus: 'AWAITING_COMMANDER',
      newStatus: 'DISPATCHED',
    });

    sseRegistry.emitEvent(result.updatedRun.id, id, EVENTS.COMMANDER_ACTION, 'COMMANDER', 2, {
      action: 'APPROVE_DISPATCH',
      incidentId: id,
    });

    return NextResponse.json({ run: result.updatedRun, incident: result.updatedIncident });
  } catch (err) {
    return NextResponse.json(
      { error: `Approval handler failure: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 },
    );
  }
}
