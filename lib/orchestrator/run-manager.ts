// lib/orchestrator/run-manager.ts
// Run manager for generating new runs, handling overrides, and checking active runs.

import { prisma } from '@/lib/db/prisma';
import type { AgentRun } from '@prisma/client';
import { agentSociety } from './agent-society';

export class RunManager {
  /**
   * Start a new agent society incident run.
   */
  static async startRun(incidentId: string, overrideInstruction?: string): Promise<AgentRun> {
    const run = await prisma.agentRun.create({
      data: {
        incidentId,
        status: 'RUNNING',
        currentRound: 1,
      },
    });

    // Run agent society asynchronously so HTTP route can return immediately
    // and browser can establish SSE listener.
    // The Event emitter / SSE streams handle sending progress updates.
    agentSociety.resolveIncident(incidentId, run.id, overrideInstruction).catch(err => {
      console.error(`Fatal run error on runId "${run.id}":`, err);
      prisma.agentRun.update({
        where: { id: run.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
        },
      }).catch(dbErr => console.error('Failed to log run failure in database:', dbErr));
    });

    return run;
  }

  /**
   * Check status of a run.
   */
  static async getRunStatus(runId: string) {
    return prisma.agentRun.findUnique({
      where: { id: runId },
      include: {
        votes: true,
        negotiations: true,
        messages: true,
      },
    });
  }
}
