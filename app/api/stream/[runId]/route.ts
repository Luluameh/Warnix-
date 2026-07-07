// app/api/stream/[runId]/route.ts
// SSE Endpoint. Establishes the text/event-stream connection between browser client and agent runs.
// Keeps connection open and pipes events from SSEEmitterRegistry.
// Module-level Node.js route.

import { sseRegistry } from '@/lib/sse/emitter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;

  const responseHeaders = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  });

  const stream = new ReadableStream({
    start(controller) {
      // Register stream controller with SSEEmitterRegistry
      sseRegistry.register(runId, controller);
    },
    cancel() {
      // SSEEmitterRegistry automatically clears interval and entries
      sseRegistry.close(runId);
    },
  });

  return new Response(stream, { headers: responseHeaders });
}
