// lib/db/queries/runs.ts
import { prisma } from '@/lib/db/prisma';

export class RunQueries {
  static async getActiveRun(incidentId: string) {
    return prisma.agentRun.findFirst({
      where: { incidentId, status: { in: ['RUNNING', 'ROUND_2', 'AWAITING_HUMAN'] } },
      orderBy: { startedAt: 'desc' },
    });
  }

  static async listRunsForIncident(incidentId: string) {
    return prisma.agentRun.findMany({
      where: { incidentId },
      orderBy: { startedAt: 'desc' },
      include: {
        votes: true,
      },
    });
  }
}
