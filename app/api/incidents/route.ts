// app/api/incidents/route.ts
// GET /api/incidents - List all incidents
// POST /api/incidents - Create a new incident and trigger agent run

import { NextResponse } from 'next/server';
import { IncidentQueries } from '@/lib/db/queries/incidents';
import { RunManager } from '@/lib/orchestrator/run-manager';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const list = await IncidentQueries.listAll();
    return NextResponse.json(list);
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to retrieve incidents: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Quick validation
    if (!body.title || !body.type || !body.severity || !body.location || !body.description) {
      return NextResponse.json({ error: 'Missing required incident fields' }, { status: 400 });
    }

    const incidentInput = {
      title: body.title,
      type: body.type,
      severity: parseInt(body.severity),
      location: body.location,
      latitude: parseFloat(body.latitude ?? 51.505),
      longitude: parseFloat(body.longitude ?? -0.09),
      description: body.description,
      demoMode: body.demoMode ?? false,
    };

    const incident = await IncidentQueries.create(incidentInput);
    const run = await RunManager.startRun(incident.id);

    return NextResponse.json({ incident, runId: run.id });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to register incident: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 },
    );
  }
}
