// app/api/incidents/[id]/route.ts
// GET /api/incidents/[id] - Get full relational data for a specific incident.

import { NextResponse } from 'next/server';
import { IncidentQueries } from '@/lib/db/queries/incidents';

export const runtime = 'nodejs';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await IncidentQueries.findById(id);
    if (!data) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to retrieve incident details: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 },
    );
  }
}
