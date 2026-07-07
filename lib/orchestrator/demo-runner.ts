// lib/orchestrator/demo-runner.ts
// Demo simulation coordinator. Simulates the 3 EOC emergencies.
// Runs the event pipeline synchronously with delays matching NASA EOC feel.

import { prisma } from '@/lib/db/prisma';
import { DEMO_INCIDENTS } from '@/lib/demo/scenarios';
import { RunManager } from './run-manager';
import { sseRegistry } from '@/lib/sse/emitter';
import { EVENTS } from '@/lib/sse/types';

export class DemoRunner {
  private activeDemo = false;

  async startDemo(broadcastRunId: string): Promise<{ firstIncidentId: string; firstRunId: string }> {
    if (this.activeDemo) {
      throw new Error('Simulation already in progress.');
    }
    this.activeDemo = true;

    sseRegistry.emitEvent(broadcastRunId, '', EVENTS.DEMO_STARTED, 'SYSTEM', 1, {
      message: 'One-click EOC demonstration simulation initialized.',
    });

    // 1. Create flooding incident (Riverside)
    sseRegistry.emitEvent(broadcastRunId, '', EVENTS.DEMO_STEP, 'SYSTEM', 1, {
      step: 1,
      message: 'Spawning scenario 1: Riverside flooding report...',
    });
    const floodIncident = await prisma.incident.create({
      data: {
        title: DEMO_INCIDENTS[0].title,
        type: DEMO_INCIDENTS[0].type,
        severity: DEMO_INCIDENTS[0].severity,
        location: DEMO_INCIDENTS[0].location,
        latitude: DEMO_INCIDENTS[0].latitude,
        longitude: DEMO_INCIDENTS[0].longitude,
        description: DEMO_INCIDENTS[0].description,
        demoMode: true,
      },
    });
    const run = await RunManager.startRun(floodIncident.id);

    // Schedule remaining steps in the background
    this.runRemainingDemoSteps(broadcastRunId).catch(err => {
      console.error('Demo simulation background process failure:', err);
    });

    return { firstIncidentId: floodIncident.id, firstRunId: run.id };
  }

  private async runRemainingDemoSteps(broadcastRunId: string): Promise<void> {
    try {
      await new Promise(resolve => setTimeout(resolve, 8000));

      // 2. Create earthquake incident (Industrial Zone)
      sseRegistry.emitEvent(broadcastRunId, '', EVENTS.DEMO_STEP, 'SYSTEM', 1, {
        step: 2,
        message: 'Spawning scenario 2: Industrial earthquake collapse...',
      });
      const quakeIncident = await prisma.incident.create({
        data: {
          title: DEMO_INCIDENTS[1].title,
          type: DEMO_INCIDENTS[1].type,
          severity: DEMO_INCIDENTS[1].severity,
          location: DEMO_INCIDENTS[1].location,
          latitude: DEMO_INCIDENTS[1].latitude,
          longitude: DEMO_INCIDENTS[1].longitude,
          description: DEMO_INCIDENTS[1].description,
          demoMode: true,
        },
      });
      await RunManager.startRun(quakeIncident.id);

      await new Promise(resolve => setTimeout(resolve, 8000));

      // 3. Create Warehouse fire (Port North)
      sseRegistry.emitEvent(broadcastRunId, '', EVENTS.DEMO_STEP, 'SYSTEM', 1, {
        step: 3,
        message: 'Spawning scenario 3: Port hazardous fire...',
      });
      const fireIncident = await prisma.incident.create({
        data: {
          title: DEMO_INCIDENTS[2].title,
          type: DEMO_INCIDENTS[2].type,
          severity: DEMO_INCIDENTS[2].severity,
          location: DEMO_INCIDENTS[2].location,
          latitude: DEMO_INCIDENTS[2].latitude,
          longitude: DEMO_INCIDENTS[2].longitude,
          description: DEMO_INCIDENTS[2].description,
          demoMode: true,
        },
      });
      await RunManager.startRun(fireIncident.id);

      await new Promise(resolve => setTimeout(resolve, 12000));

      // 4. Simulate active route block interrupt
      sseRegistry.emitEvent(broadcastRunId, '', EVENTS.DEMO_STEP, 'SYSTEM', 1, {
        step: 4,
        message: 'Injecting road hazard interrupt: Route VIA-Sector 4 blocked...',
      });
      // Broadcast route blockage directly on active runs
      const activeRuns = await prisma.agentRun.findMany({
        where: { status: { in: ['RUNNING', 'ROUND_2', 'AWAITING_HUMAN'] } },
      });
      for (const run of activeRuns) {
        sseRegistry.emitEvent(run.id, run.incidentId, EVENTS.ROUTE_BLOCKED, 'HERALD', 1, {
          routeId: 'ROUTE-SECTOR-4',
          name: 'Sector 4 Bypass',
          reason: 'Severe landslide hazard reported near bypass road.',
          reportedBy: 'HERALD',
        });
      }

      await new Promise(resolve => setTimeout(resolve, 8000));

      // End of demo
      sseRegistry.emitEvent(broadcastRunId, '', EVENTS.DEMO_COMPLETED, 'SYSTEM', 1, {
        message: 'Demo sequence finished. All 3 incidents processing inside the society.',
      });
    } catch (err) {
      console.error('Demo simulation failure:', err);
    } finally {
      this.activeDemo = false;
    }
  }
}

export const demoRunner = new DemoRunner();
