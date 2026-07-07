// app/api/resources/route.ts
import { NextResponse } from 'next/server';
import { ResourceQueries } from '@/lib/db/queries/resources';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const list = await ResourceQueries.listAll();
    return NextResponse.json(list);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
