// lib/memory/shared-memory.ts
// Cross-agent blackboard. Every agent reads and writes this during an incident run.
// Acts as the "shared understanding" that evolves as debate progresses.

import { randomUUID } from 'crypto';
import type { AgentId } from '@/types';
import type {
  SharedIncidentContext,
  SharedFact,
  EvidenceItem,
  SharedRoute,
  OpenConflict,
  ResourceRequest,
  EvidenceTier,
  FactStatus,
} from './memory-types';

class SharedMemoryStore {
  private store = new Map<string, SharedIncidentContext>();

  // ─── Lifecycle ────────────────────────────────────────────────────────

  create(incidentId: string, runId: string): SharedIncidentContext {
    const ctx: SharedIncidentContext = {
      incidentId,
      runId,
      createdAt: new Date(),
      updatedAt: new Date(),
      facts: [],
      routes: [],
      resourceRequests: {},
      evidencePool: [],
      conflicts: [],
    };
    this.store.set(runId, ctx);
    return ctx;
  }

  get(runId: string): SharedIncidentContext | null {
    return this.store.get(runId) ?? null;
  }

  delete(runId: string): void {
    this.store.delete(runId);
  }

  private touch(runId: string): SharedIncidentContext {
    const ctx = this.store.get(runId);
    if (!ctx) throw new Error(`SharedMemoryStore: run "${runId}" not found`);
    ctx.updatedAt = new Date();
    return ctx;
  }

  // ─── Facts ────────────────────────────────────────────────────────────

  addFact(
    runId: string,
    agentId: AgentId,
    claim: string,
    tier: EvidenceTier,
    status: FactStatus = 'DISPUTED',
  ): SharedFact {
    const ctx = this.touch(runId);
    const fact: SharedFact = {
      id: randomUUID(),
      claim,
      addedBy: agentId,
      confirmedBy: [],
      challengedBy: [],
      evidenceTier: tier,
      status,
      addedAt: new Date(),
    };
    ctx.facts.push(fact);
    return fact;
  }

  confirmFact(runId: string, factId: string, agentId: AgentId): void {
    const ctx = this.touch(runId);
    const fact = ctx.facts.find(f => f.id === factId);
    if (!fact) return;
    if (!fact.confirmedBy.includes(agentId)) {
      fact.confirmedBy.push(agentId);
    }
    fact.challengedBy = fact.challengedBy.filter(a => a !== agentId);
    // Auto-confirm if ≥2 agents confirmed and none challenging
    if (fact.confirmedBy.length >= 2 && fact.challengedBy.length === 0) {
      fact.status = 'CONFIRMED';
    }
  }

  challengeFact(runId: string, factId: string, agentId: AgentId): void {
    const ctx = this.touch(runId);
    const fact = ctx.facts.find(f => f.id === factId);
    if (!fact) return;
    if (!fact.challengedBy.includes(agentId)) {
      fact.challengedBy.push(agentId);
    }
    fact.confirmedBy = fact.confirmedBy.filter(a => a !== agentId);
    fact.status = 'DISPUTED';
  }

  setFactStatus(runId: string, factId: string, status: FactStatus): void {
    const ctx = this.touch(runId);
    const fact = ctx.facts.find(f => f.id === factId);
    if (fact) fact.status = status;
  }

  getConfirmedFacts(runId: string): SharedFact[] {
    return this.store.get(runId)?.facts.filter(f => f.status === 'CONFIRMED') ?? [];
  }

  getDisputedFacts(runId: string): SharedFact[] {
    return this.store.get(runId)?.facts.filter(f => f.status === 'DISPUTED') ?? [];
  }

  // ─── Evidence ─────────────────────────────────────────────────────────

  addEvidence(
    runId: string,
    agentId: AgentId,
    content: string,
    tier: EvidenceTier,
    source: string,
  ): EvidenceItem {
    const ctx = this.touch(runId);
    const item: EvidenceItem = {
      id: randomUUID(),
      content,
      tier,
      source,
      addedBy: agentId,
      addedAt: new Date(),
    };
    ctx.evidencePool.push(item);
    return item;
  }

  getEvidenceByTier(runId: string, maxTier: EvidenceTier): EvidenceItem[] {
    return this.store.get(runId)?.evidencePool.filter(e => e.tier <= maxTier) ?? [];
  }

  // ─── Routes ───────────────────────────────────────────────────────────

  upsertRoute(runId: string, route: SharedRoute): void {
    const ctx = this.touch(runId);
    const idx = ctx.routes.findIndex(r => r.id === route.id);
    if (idx >= 0) {
      ctx.routes[idx] = route;
    } else {
      ctx.routes.push(route);
    }
  }

  getBlockedRoutes(runId: string): SharedRoute[] {
    return this.store.get(runId)?.routes.filter(r => r.status === 'BLOCKED') ?? [];
  }

  // ─── Resource Requests ────────────────────────────────────────────────

  addResourceRequest(
    runId: string,
    resourceType: string,
    agentId: AgentId,
    count: number,
    reason: string,
  ): void {
    const ctx = this.touch(runId);
    if (!ctx.resourceRequests[resourceType]) {
      ctx.resourceRequests[resourceType] = [];
    }
    ctx.resourceRequests[resourceType].push({
      agentId,
      count,
      reason,
      requestedAt: new Date(),
    } as ResourceRequest);
  }

  // ─── Conflicts ────────────────────────────────────────────────────────

  openConflict(runId: string, between: [AgentId, AgentId], claim: string): OpenConflict {
    const ctx = this.touch(runId);
    const conflict: OpenConflict = {
      id: randomUUID(),
      between,
      claim,
      resolved: false,
    };
    ctx.conflicts.push(conflict);
    return conflict;
  }

  resolveConflict(runId: string, conflictId: string, resolution: string): void {
    const ctx = this.touch(runId);
    const conflict = ctx.conflicts.find(c => c.id === conflictId);
    if (!conflict) return;
    conflict.resolved = true;
    conflict.resolvedAt = new Date();
    conflict.resolution = resolution;
  }

  getOpenConflicts(runId: string): OpenConflict[] {
    return this.store.get(runId)?.conflicts.filter(c => !c.resolved) ?? [];
  }

  // ─── Consensus Helpers ────────────────────────────────────────────────

  setAgreedSeverity(runId: string, severity: number): void {
    const ctx = this.touch(runId);
    ctx.agreedSeverity = severity;
  }

  setAgreedIncidentType(runId: string, type: string): void {
    const ctx = this.touch(runId);
    ctx.agreedIncidentType = type;
  }

  setHumanOverride(runId: string, instruction: string): void {
    const ctx = this.touch(runId);
    ctx.humanOverride = instruction;
  }

  // ─── Prompt Serialization ─────────────────────────────────────────────

  /**
   * Serialize shared context for injection into LLM prompts.
   * Keeps it compact — only the most relevant fields.
   */
  formatForPrompt(runId: string): string {
    const ctx = this.store.get(runId);
    if (!ctx) return 'No shared incident context available.';

    const confirmed = ctx.facts.filter(f => f.status === 'CONFIRMED');
    const disputed  = ctx.facts.filter(f => f.status === 'DISPUTED');
    const blocked   = ctx.routes.filter(r => r.status === 'BLOCKED');
    const open      = ctx.conflicts.filter(c => !c.resolved);
    const evidence  = ctx.evidencePool.slice(-10); // last 10 items

    return [
      `CONFIRMED FACTS (${confirmed.length}):`,
      confirmed.map(f => `  • [T${f.evidenceTier}] ${f.claim} (confirmed by: ${f.confirmedBy.join(', ')})`).join('\n') || '  None',
      '',
      `DISPUTED CLAIMS (${disputed.length}):`,
      disputed.map(f => `  • ${f.claim} (challenged by: ${f.challengedBy.join(', ')})`).join('\n') || '  None',
      '',
      `BLOCKED ROUTES (${blocked.length}):`,
      blocked.map(r => `  • ${r.name} — ${r.blockedReason ?? 'reason unknown'} (reported by: ${r.blockedBy ?? 'unknown'})`).join('\n') || '  None',
      '',
      `OPEN CONFLICTS (${open.length}):`,
      open.map(c => `  • ${c.between[0]} vs ${c.between[1]}: "${c.claim}"`).join('\n') || '  None',
      '',
      `EVIDENCE POOL (${evidence.length} recent items):`,
      evidence.map(e => `  • [TIER_${e.tier}] ${e.content} — Source: ${e.source} (${e.addedBy})`).join('\n') || '  None',
      ctx.humanOverride ? `\nHUMAN OVERRIDE INSTRUCTION: "${ctx.humanOverride}"` : '',
    ].join('\n');
  }

  // ─── Snapshot (for DB persistence) ────────────────────────────────────

  snapshot(runId: string): string | null {
    const ctx = this.store.get(runId);
    if (!ctx) return null;
    return JSON.stringify({
      ...ctx,
      createdAt: ctx.createdAt.toISOString(),
      updatedAt: ctx.updatedAt.toISOString(),
    });
  }
}

// Module-level singleton
export const sharedMemory = new SharedMemoryStore();
