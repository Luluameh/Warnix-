// lib/memory/memory-types.ts
// Shared memory system type definitions.

import type { AgentId } from '@/types';

// ─── Short-Term Memory (per-agent, private) ────────────────────────────────

export interface MemoryEntry {
  incidentId: string;
  timestamp: Date;
  observation: string;   // what this agent concluded
  outcome?: string;      // filled post-incident
  confidence: number;
  tags: string[];        // ['flood', 'bridge', 'gps-drift']
}

// ─── Shared Incident Memory (cross-agent blackboard) ─────────────────────

export type FactStatus = 'CONFIRMED' | 'DISPUTED' | 'RETRACTED';
export type EvidenceTier = 1 | 2 | 3;

export interface SharedFact {
  id: string;
  claim: string;
  addedBy: AgentId;
  confirmedBy: AgentId[];
  challengedBy: AgentId[];
  evidenceTier: EvidenceTier;
  status: FactStatus;
  addedAt: Date;
}

export interface EvidenceItem {
  id: string;
  content: string;
  tier: EvidenceTier;
  source: string;
  addedBy: AgentId;
  addedAt: Date;
}

export interface SharedRoute {
  id: string;
  name: string;
  status: 'CLEAR' | 'BLOCKED' | 'UNCERTAIN';
  blockedBy?: AgentId;
  blockedReason?: string;
  confirmedAt?: Date;
}

export interface ResourceRequest {
  agentId: AgentId;
  count: number;
  reason: string;
  requestedAt: Date;
}

export interface OpenConflict {
  id: string;
  between: [AgentId, AgentId];
  claim: string;
  resolved: boolean;
  resolvedAt?: Date;
  resolution?: string;
}

export interface SharedIncidentContext {
  incidentId: string;
  runId: string;
  createdAt: Date;
  updatedAt: Date;

  // Collaborative fact pool — any agent can add/confirm/challenge
  facts: SharedFact[];

  // Route status known to all agents
  routes: SharedRoute[];

  // Resource requests per type
  resourceRequests: Record<string, ResourceRequest[]>;

  // Evidence pool shared across all agents
  evidencePool: EvidenceItem[];

  // Open conflicts visible to all
  conflicts: OpenConflict[];

  // Consensus fields (set when agents agree)
  agreedSeverity?: number;
  agreedIncidentType?: string;

  // Human override instruction (if any)
  humanOverride?: string;
}

export type SharedIncidentContextSnapshot = Omit<SharedIncidentContext, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};
