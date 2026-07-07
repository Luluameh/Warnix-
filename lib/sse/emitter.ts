// lib/sse/emitter.ts
// SSE stream registry. Maps runId → ReadableStreamDefaultController.
// Allows agents running server-side to push events to connected browser clients.
// Module-level singleton — requires Node.js runtime (not Edge).

import type { AgentSSEEvent, SSEEventType } from './types';
import { SSE_EVENTS } from './types';

const encoder = new TextEncoder();

/** Format an SSE event as the wire protocol string */
function formatSSEMessage(event: AgentSSEEvent): Uint8Array {
  const data = JSON.stringify(event);
  return encoder.encode(`data: ${data}\n\n`);
}

/** Format a ping keepalive */
function formatPing(): Uint8Array {
  const ping = JSON.stringify({
    type: SSE_EVENTS.PING,
    agentId: 'SYSTEM',
    incidentId: '',
    runId: '',
    round: 1,
    timestamp: new Date().toISOString(),
    payload: {},
  } satisfies AgentSSEEvent);
  return encoder.encode(`data: ${ping}\n\n`);
}

type StreamController = ReadableStreamDefaultController<Uint8Array>;

interface StreamEntry {
  controller: StreamController;
  pingInterval: ReturnType<typeof setInterval>;
  connectedAt: Date;
}

class SSEEmitterRegistry {
  private registry = new Map<string, StreamEntry>();

  /**
   * Register a new SSE stream for a run.
   * Starts a keepalive ping every 20 seconds.
   */
  register(runId: string, controller: StreamController): void {
    // Cleanup any existing stream for this run
    this.close(runId);

    const pingInterval = setInterval(() => {
      try {
        controller.enqueue(formatPing());
      } catch {
        // Controller closed — cleanup
        this.close(runId);
      }
    }, 20_000);

    this.registry.set(runId, {
      controller,
      pingInterval,
      connectedAt: new Date(),
    });
  }

  /**
   * Emit a typed SSE event to a specific run's stream.
   */
  emit(runId: string, event: AgentSSEEvent): void {
    const entry = this.registry.get(runId);
    if (!entry) return;
    try {
      entry.controller.enqueue(formatSSEMessage(event));
    } catch {
      // Enqueue failed — stream likely closed
      this.close(runId);
    }
  }

  /**
   * Emit a simple helper — builds the event from parts.
   */
  emitEvent(
    runId: string,
    incidentId: string,
    type: SSEEventType,
    agentId: AgentSSEEvent['agentId'],
    round: 1 | 2,
    payload: Record<string, unknown>,
  ): void {
    this.emit(runId, {
      type,
      agentId,
      incidentId,
      runId,
      round,
      timestamp: new Date().toISOString(),
      payload,
    });
  }

  /**
   * Broadcast an event to ALL active runs (e.g., demo start).
   */
  broadcast(event: Omit<AgentSSEEvent, 'runId'>): void {
    for (const [runId] of this.registry) {
      this.emit(runId, { ...event, runId });
    }
  }

  /**
   * Close and cleanup a stream.
   */
  close(runId: string): void {
    const entry = this.registry.get(runId);
    if (!entry) return;
    clearInterval(entry.pingInterval);
    try { entry.controller.close(); } catch { /* already closed */ }
    this.registry.delete(runId);
  }

  /**
   * Check if a run has an active stream.
   */
  has(runId: string): boolean {
    return this.registry.has(runId);
  }

  /**
   * Get count of active streams (debugging).
   */
  activeCount(): number {
    return this.registry.size;
  }
}

// Module-level singleton
export const sseRegistry = new SSEEmitterRegistry();
