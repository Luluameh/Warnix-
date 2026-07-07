// lib/db/queries/timeline.ts
import { prisma } from '@/lib/db/prisma';
import type { TimelineEntryInput } from '@/types';

export class TimelineQueries {
  static async listForIncident(incidentId: string) {
    return prisma.timelineEntry.findMany({
      where: { incidentId },
      orderBy: { timestamp: 'asc' },
    });
  }

  static async log(input: TimelineEntryInput) {
    return prisma.timelineEntry.create({
      data: {
        incidentId: input.incidentId,
        agentId: input.agentId,
        category: input.category,
        title: input.title,
        detail: input.detail,
        severity: input.severity ?? 'INFO',
      },
    });
  }
}
