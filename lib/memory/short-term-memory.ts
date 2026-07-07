// lib/memory/short-term-memory.ts
// Per-agent rolling memory store. Private to each agent — not cross-agent.
// In-process singleton. Cleared on server restart (acceptable for hackathon).

import type { AgentId } from '@/types';
import type { MemoryEntry } from './memory-types';

const MAX_ENTRIES_PER_AGENT = 20;
const DEFAULT_RECALL_LIMIT = 5;

class ShortTermMemory {
  private store = new Map<AgentId, MemoryEntry[]>();

  /**
   * Add a new memory observation for an agent.
   * Evicts oldest entry (FIFO) when limit is reached.
   */
  add(agentId: AgentId, entry: Omit<MemoryEntry, 'timestamp'>): void {
    const entries = this.store.get(agentId) ?? [];
    entries.push({ ...entry, timestamp: new Date() });
    if (entries.length > MAX_ENTRIES_PER_AGENT) {
      entries.shift(); // FIFO eviction
    }
    this.store.set(agentId, entries);
  }

  /**
   * Retrieve the most recent N memories for an agent.
   */
  get(agentId: AgentId, limit: number = DEFAULT_RECALL_LIMIT): MemoryEntry[] {
    const entries = this.store.get(agentId) ?? [];
    return entries.slice(-limit);
  }

  /**
   * Retrieve memories matching any of the given tags.
   */
  getByTags(agentId: AgentId, tags: string[], limit: number = DEFAULT_RECALL_LIMIT): MemoryEntry[] {
    const entries = this.store.get(agentId) ?? [];
    const tagSet = new Set(tags.map(t => t.toLowerCase()));
    return entries
      .filter(e => e.tags.some(t => tagSet.has(t.toLowerCase())))
      .slice(-limit);
  }

  /**
   * Update the outcome field of the most recent memory for an incident.
   */
  recordOutcome(agentId: AgentId, incidentId: string, outcome: string): void {
    const entries = this.store.get(agentId);
    if (!entries) return;
    const entry = [...entries].reverse().find(e => e.incidentId === incidentId);
    if (entry) entry.outcome = outcome;
  }

  /**
   * Format memories as a readable string for injection into LLM prompts.
   */
  formatForPrompt(agentId: AgentId, limit: number = DEFAULT_RECALL_LIMIT): string {
    const entries = this.get(agentId, limit);
    if (entries.length === 0) return 'No prior incidents in current session.';
    return entries
      .map((e, i) =>
        `[Memory ${i + 1}] Incident ${e.incidentId} (tags: ${e.tags.join(', ')}):\n` +
        `  Observation: ${e.observation}\n` +
        (e.outcome ? `  Outcome: ${e.outcome}\n` : '') +
        `  Confidence: ${Math.round(e.confidence * 100)}%`
      )
      .join('\n\n');
  }

  /**
   * Clear all memories for an agent (e.g., on session reset).
   */
  clear(agentId: AgentId): void {
    this.store.delete(agentId);
  }

  /**
   * Clear all agent memories.
   */
  clearAll(): void {
    this.store.clear();
  }

  /**
   * Get total memory count for an agent.
   */
  count(agentId: AgentId): number {
    return this.store.get(agentId)?.length ?? 0;
  }
}

// Module-level singleton — shared across all requests in the same process
export const shortTermMemory = new ShortTermMemory();
