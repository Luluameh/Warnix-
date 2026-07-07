// app/api/demo/route.ts
// POST /api/demo - Run EOC 3-incident demonstration simulation

import { NextResponse } from 'next/server';
import { demoRunner } from '@/lib/orchestrator/demo-runner';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const broadcastRunId = body.runId ?? 'demo-broadcast-run-id';

    // Spawn first scenario and get its run data
    const result = await demoRunner.startDemo(broadcastRunId);

    return NextResponse.json({
      success: true,
      message: 'Demo simulation started in background.',
      firstIncidentId: result.firstIncidentId,
      firstRunId: result.firstRunId,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
