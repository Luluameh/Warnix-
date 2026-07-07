// lib/orchestrator/event-bus.ts
// Typed Event Bus using Node.js EventEmitter.
// Allows parallel running agents to communicate asynchronously inside the EOC.

import { EventEmitter } from 'events';
import type { AgentId } from '@/types';
import type { AgentSSEEvent, SSEEventType } from '@/lib/sse/types';

class AgentEventBus extends EventEmitter {
  /**
   * Emit a typed event to all listeners inside the EOC orchestrator.
   */
  publish(runId: string, type: SSEEventType, agentId: AgentId | 'SYSTEM' | 'HUMAN', incidentId: string, round: 1 | 2, payload: Record<string, unknown>): void {
    const event: AgentSSEEvent = {
      type,
      agentId,
      incidentId,
      runId,
      round,
      timestamp: new Date().toISOString(),
      payload,
    };
    
    // Emit standard Event Emitter event
    this.emit(type, event);
    this.emit('*', event); // Wildcard listener support
  }

  /**
   * Helper to wait for a specific event matching condition.
   * Useful for coordinating async agent interactions without polling.
   */
  waitFor(type: SSEEventType, filter: (event: AgentSSEEvent) => boolean, timeoutMs = 30_000): Promise<AgentSSEEvent> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.off(type, handler);
        reject(new Error(`EventBus timeout waiting for event: ${type}`));
      }, timeoutMs);

      const handler = (event: AgentSSEEvent) => {
        if (filter(event)) {
          clearTimeout(timer);
          this.off(type, handler);
          resolve(event);
        }
      };

      this.on(type, handler);
    });
  }
}

// Global process-wide Event Bus singleton
export const eventBus = new AgentEventBus();
