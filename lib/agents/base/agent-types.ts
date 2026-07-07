// lib/agents/base/agent-types.ts
// Core interfaces every agent implements.

import type {
  AgentId, AgentVoteResponse, AgentRunContext, VoteType,
} from '@/types';
import type { MemoryEntry } from '@/lib/memory/memory-types';

// ─── Agent Execution Interface ─────────────────────────────────────────────

export interface IAgent {
  readonly agentId: AgentId;

  /**
   * Round 1: run full independent analysis, write to shared memory,
   * emit SSE events, return a vote response.
   */
  run(ctx: AgentRunContext): Promise<AgentVoteResponse>;

  /**
   * Round 2: respond to a specific question from NEXUS.
   * Returns a plain-language answer string.
   */
  respond(question: string, ctx: AgentRunContext): Promise<string>;
}

// ─── Agent Base Dependencies (injected, not imported directly) ─────────────

export interface AgentDeps {
  runId: string;
  incidentId: string;
}

// ─── Debate Message (emitted from agents) ─────────────────────────────────

export interface DebateMessage {
  id: string;
  runId: string;
  incidentId: string;
  fromAgent: AgentId | 'SYSTEM' | 'HUMAN';
  toAgent?: AgentId;
  messageType: string;  // MessageType const value
  content: string;
  reasoning?: string;
  evidenceTier?: 1 | 2 | 3;
  round: 1 | 2;
  timestamp: Date;
}

// ─── Raw LLM Output Shapes (per agent) ────────────────────────────────────

/** SIGMA output */
export interface SigmaOutput {
  incident_type: string;
  severity: number;
  confirmed_location: { lat: number; lng: number; name: string };
  affected_radius_km: number;
  estimated_casualties: number | null;
  key_facts: string[];
  unknowns: string[];
  flags: string[];
  recommendation: string;
  confidence: number;
  urgency: number;
  risks: string[];
  memory_influence: string | null;
}

/** AXIOM output */
export interface AxiomOutput {
  verified_claims: string[];
  disputed_claims: string[];
  challenges: Array<{ target_agent: AgentId; claim: string; reason: string }>;
  duplicate_risk: number;
  believability_score: number;
  recommendation: string;
  confidence: number;
  urgency: number;
  risks: string[];
  memory_influence: string | null;
}

/** HERALD output */
export interface HeraldOutput {
  news_items: Array<{ content: string; tier: 1 | 2 | 3; source: string }>;
  weather_update: { condition: string; alert: boolean; eta_minutes: number | null } | null;
  route_alerts: Array<{ routeId: string; name: string; status: string; reason: string }>;
  recommendation: string;
  confidence: number;
  urgency: number;
  risks: string[];
  memory_influence: string | null;
}

/** AEGIS output */
export interface AegisOutput {
  available: Record<string, number>;
  allocated: Array<{ resource: string; incidentId: string; count: number; reasoning: string; eta_minutes?: number }>;
  shortages: Array<{ type: string; deficit: number; affected: string[]; mitigation: string }>;
  contention: Array<{ resource: string; incidents: string[]; winner: string; loser: string; formula: string; mitigation: string }>;
  efficiency_score: number;
  recommendation: string;
  confidence: number;
  urgency: number;
  risks: string[];
  memory_influence: string | null;
}

/** ATLAS output */
export interface AtlasOutput {
  plan: { primary_action: string; phases: string[] };
  routes: Array<{ id: string; name: string; status: string; waypoints: Array<[number, number]>; blocked_reason: string | null }>;
  shelter_assignments: Array<{ name: string; lat: number; lng: number; capacity: number }>;
  triage_zones: Array<{ zone: string; priority: 1 | 2 | 3; lat: number; lng: number }>;
  resource_requests: Record<string, number>;
  revisions: Array<{ from: string; to: string; reason: string }>;
  confidence: number;
  urgency: number;
  risks: string[];
  memory_influence: string | null;
  recommendation: string;
  needs_archive: boolean;
}

/** ARCHIVE output */
export interface ArchiveOutput {
  historical_matches: Array<{
    title: string;
    year: number;
    location: string;
    similarity_score: number;
    summary: string;
    lessons_learned: string[];
    successful_strategies: string[];
    failures: string[];
  }>;
  recommended_actions: string[];
  warnings: string[];
  tiebreak_support?: { supports: AgentId; reasoning: string };
  confidence: number;
  no_precedent: boolean;
}

/** NEXUS Round 1 output */
export interface NexusRound1Output {
  round_2_questions: Array<{ to: AgentId; question: string; triggered_by: string }>;
  detected_conflicts: Array<{ between: [AgentId, AgentId]; claim: string }>;
  preliminary_confidence: number;
  needs_round_2: boolean;
}

/** NEXUS Final Decision output */
export interface NexusFinalOutput {
  final_plan: {
    primary_action: string;
    phases: string[];
    resources: Array<{ resource: string; incidentId: string; count: number; reasoning: string; eta_minutes?: number }>;
    routes: Array<{ id: string; name: string; status: string; waypoints: Array<[number, number]> }>;
    shelter_assignments: Array<{ name: string; lat: number; lng: number; capacity: number }>;
    triage_zones: Array<{ zone: string; priority: number; lat: number; lng: number }>;
  };
  agent_consensus: Array<{ agentId: AgentId; vote: VoteType; confidence: number; reasoning: string }>;
  conflicts_resolved: Array<{ conflict: string; between: [AgentId, AgentId]; resolution: string; reasoning: string }>;
  rejected_alternatives: Array<{ option: string; rejected_by: AgentId[]; reason: string }>;
  historical_precedent: string | null;
  weighted_score_calculation: string;
  overall_confidence: number;
  overall_urgency: number;
  decision_narrative: string;
  human_approval_required: boolean;
  human_checkpoint: { message: string; summary: string };
}

// Re-export for convenience
export type { AgentVoteResponse, AgentRunContext, MemoryEntry };
