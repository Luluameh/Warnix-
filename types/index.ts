// =============================================================================
// Warnix — Shared TypeScript Types
// Single source of truth for all types used across the application.
// =============================================================================

// ─── Agent Identity ────────────────────────────────────────────────────────

export const AgentId = {
  SIGMA:    'SIGMA',
  AXIOM:    'AXIOM',
  HERALD:   'HERALD',
  AEGIS:    'AEGIS',
  ATLAS:    'ATLAS',
  ARCHIVE:  'ARCHIVE',
  NEXUS:    'NEXUS',
} as const;
export type AgentId = typeof AgentId[keyof typeof AgentId];

export const AGENT_IDS = Object.values(AgentId) as AgentId[];

export const SPECIALIST_AGENT_IDS: AgentId[] = [
  AgentId.SIGMA, AgentId.AXIOM, AgentId.HERALD,
  AgentId.AEGIS, AgentId.ATLAS, AgentId.ARCHIVE,
];

export interface AgentMeta {
  id: AgentId;
  name: string;
  role: string;
  color: string;
  glyph: string;
  personality: string;
}

export const AGENT_META: Record<AgentId, AgentMeta> = {
  SIGMA:   { id: 'SIGMA',   name: 'SIGMA',   role: 'Incident Classification',   color: '#E53E3E', glyph: '⬡', personality: 'Cold, methodical, terse' },
  AXIOM:   { id: 'AXIOM',   name: 'AXIOM',   role: 'Verification',              color: '#805AD5', glyph: '◈', personality: 'Socratic skeptic' },
  HERALD:  { id: 'HERALD',  name: 'HERALD',  role: 'External Intelligence',     color: '#D69E2E', glyph: '◉', personality: 'Fast, urgent, self-aware' },
  AEGIS:   { id: 'AEGIS',   name: 'AEGIS',   role: 'Resource Allocation',       color: '#38A169', glyph: '◆', personality: 'Pragmatic, numbers-driven' },
  ATLAS:   { id: 'ATLAS',   name: 'ATLAS',   role: 'Rescue & Evacuation',       color: '#3182CE', glyph: '⬟', personality: 'Safety-obsessed, strategic' },
  ARCHIVE: { id: 'ARCHIVE', name: 'ARCHIVE', role: 'Institutional Memory',      color: '#744210', glyph: '◇', personality: 'Wise, measured, precise' },
  NEXUS:   { id: 'NEXUS',   name: 'NEXUS',   role: 'Coordinator & Decision',    color: '#718096', glyph: '⊕', personality: 'Judicious, transparent' },
};

// ─── Incident Types ────────────────────────────────────────────────────────

export const IncidentType = {
  FLOOD:             'FLOOD',
  EARTHQUAKE:        'EARTHQUAKE',
  FIRE:              'FIRE',
  BUILDING_COLLAPSE: 'BUILDING_COLLAPSE',
  POWER_OUTAGE:      'POWER_OUTAGE',
  CHEMICAL_SPILL:    'CHEMICAL_SPILL',
  STORM:             'STORM',
  TSUNAMI:           'TSUNAMI',
  WILDFIRE:          'WILDFIRE',
} as const;
export type IncidentType = typeof IncidentType[keyof typeof IncidentType];

export const IncidentStatus = {
  NEW:                'NEW',
  UNDER_REVIEW:       'UNDER_REVIEW',
  ROUND_1_DEBATE:     'ROUND_1_DEBATE',
  ROUND_2_DEBATE:     'ROUND_2_DEBATE',
  AWAITING_COMMANDER: 'AWAITING_COMMANDER',
  DISPATCHED:         'DISPATCHED',
  ACTIVE:             'ACTIVE',
  CONTAINED:          'CONTAINED',
  RESOLVED:           'RESOLVED',
  FALSE_ALARM:        'FALSE_ALARM',
  DUPLICATE:          'DUPLICATE',
  WITHDRAWN:          'WITHDRAWN',
  ARCHIVED:           'ARCHIVED',
} as const;
export type IncidentStatus = typeof IncidentStatus[keyof typeof IncidentStatus];

// ─── Run Status ────────────────────────────────────────────────────────────

export const RunStatus = {
  RUNNING:         'RUNNING',
  ROUND_2:         'ROUND_2',
  AWAITING_HUMAN:  'AWAITING_HUMAN',
  COMPLETED:       'COMPLETED',
  OVERRIDDEN:      'OVERRIDDEN',
  FAILED:          'FAILED',
} as const;
export type RunStatus = typeof RunStatus[keyof typeof RunStatus];

// ─── Vote Types ────────────────────────────────────────────────────────────

export const VoteType = {
  AGREE:    'AGREE',
  PARTIAL:  'PARTIAL',
  DISAGREE: 'DISAGREE',
} as const;
export type VoteType = typeof VoteType[keyof typeof VoteType];

// ─── Message Types (Debate Protocol) ──────────────────────────────────────

export const MessageType = {
  STATEMENT:      'STATEMENT',
  CHALLENGE:      'CHALLENGE',
  EVIDENCE:       'EVIDENCE',
  REVISION:       'REVISION',
  RULING:         'RULING',
  NEGOTIATION_Q:  'NEGOTIATION_Q',
  NEGOTIATION_A:  'NEGOTIATION_A',
  OVERRIDE:       'OVERRIDE',
} as const;
export type MessageType = typeof MessageType[keyof typeof MessageType];

// ─── Resource Types ────────────────────────────────────────────────────────

export const ResourceType = {
  AMBULANCE:       'AMBULANCE',
  FIRE_TRUCK:      'FIRE_TRUCK',
  RESCUE_TEAM:     'RESCUE_TEAM',
  HELICOPTER:      'HELICOPTER',
  SHELTER:         'SHELTER',
  VOLUNTEER_GROUP: 'VOLUNTEER_GROUP',
} as const;
export type ResourceType = typeof ResourceType[keyof typeof ResourceType];

export const ResourceStatus = {
  AVAILABLE:   'AVAILABLE',
  DEPLOYED:    'DEPLOYED',
  PREPARING:   'PREPARING',
  DEPLOYING:   'DEPLOYING',
  EN_ROUTE:    'EN_ROUTE',
  ON_SCENE:    'ON_SCENE',
  RETURNING:   'RETURNING',
  UNAVAILABLE: 'UNAVAILABLE',
} as const;
export type ResourceStatus = typeof ResourceStatus[keyof typeof ResourceStatus];

export const DeploymentStatus = {
  PENDING:   'PENDING',
  EN_ROUTE:  'EN_ROUTE',
  ARRIVED:   'ARRIVED',
  COMPLETED: 'COMPLETED',
  RECALLED:  'RECALLED',
} as const;
export type DeploymentStatus = typeof DeploymentStatus[keyof typeof DeploymentStatus];

// ─── Timeline ──────────────────────────────────────────────────────────────

export const TimelineCategory = {
  REPORT:       'REPORT',
  ANALYSIS:     'ANALYSIS',
  CHALLENGE:    'CHALLENGE',
  REVISION:     'REVISION',
  NEGOTIATION:  'NEGOTIATION',
  DECISION:     'DECISION',
  DEPLOYMENT:   'DEPLOYMENT',
  UPDATE:       'UPDATE',
  COMPLETION:   'COMPLETION',
  HUMAN:        'HUMAN',
  INTERRUPT:    'INTERRUPT',
} as const;
export type TimelineCategory = typeof TimelineCategory[keyof typeof TimelineCategory];

export type TimelineSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface TimelineEntryInput {
  incidentId: string;
  agentId: string;
  category: TimelineCategory;
  title: string;
  detail: string;
  severity?: TimelineSeverity;
}

// ─── Incident Domain Objects ───────────────────────────────────────────────

export interface IncidentInput {
  title: string;
  type: IncidentType;
  severity: number;
  location: string;
  latitude: number;
  longitude: number;
  description: string;
  demoMode?: boolean;
}

export interface IncidentRecord extends IncidentInput {
  id: string;
  status: IncidentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface HistoricalIncidentRecord {
  id: string;
  type: IncidentType;
  title: string;
  summary: string;
  location: string;
  year: number;
  severity: number;
  lessonsLearned: string[];
  successfulStrategies: string[];
  failures: string[];
  resourcesUsed: Record<string, unknown>;
  outcome: string;
  tags: string[];
}

// ─── Resource Domain Objects ───────────────────────────────────────────────

export interface ResourceRecord {
  id: string;
  type: ResourceType;
  name: string;
  callSign: string;
  status: ResourceStatus;
  latitude: number;
  longitude: number;
  homeBase: string;
}

export interface ResourceAllocation {
  resource: ResourceType;
  incidentId: string;
  count: number;
  reasoning: string;
  etaMinutes?: number;
  route?: Route;
}

// ─── Route & Geospatial ────────────────────────────────────────────────────

export type LatLng = [number, number];

export interface Route {
  id: string;
  name: string;
  status: 'CLEAR' | 'BLOCKED' | 'UNCERTAIN' | 'ALTERNATE';
  waypoints: LatLng[];
  blockedBy?: AgentId;
  blockedReason?: string;
}

// ─── Agent Vote & Response Types ───────────────────────────────────────────

export interface AgentVoteResponse {
  agentId: AgentId;
  confidence: number;
  urgency: number;
  vote: VoteType;
  recommendation: string;
  reasoning: string;
  detectedRisks: string[];
  agreesWith: AgentId[];
  disagreesWith: AgentId[];
  shortTermMemoryUsed: boolean;
  memoryInfluence: string | null;
  revision?: {
    previousRecommendation: string;
    newRecommendation: string;
    reason: string;
  };
  // Raw structured data from each agent's JSON output
  rawOutput: Record<string, unknown>;
}

// ─── Coordinator Decision ──────────────────────────────────────────────────

export interface ConflictResolution {
  conflict: string;
  between: [AgentId, AgentId];
  resolution: string;
  reasoning: string;
}

export interface RejectedAlternative {
  option: string;
  rejectedBy: AgentId[];
  reason: string;
}

export interface CoordinatorDecision {
  finalPlan: FinalPlan;
  agentConsensus: AgentConsensusEntry[];
  conflictsResolved: ConflictResolution[];
  rejectedAlternatives: RejectedAlternative[];
  historicalPrecedent: string | null;
  overallConfidence: number;
  overallUrgency: number;
  decisionNarrative: string;
  humanApprovalRequired: boolean;
  humanCheckpoint: {
    message: string;
    summary: string;
  };
}

export interface AgentConsensusEntry {
  agentId: AgentId;
  vote: VoteType;
  confidence: number;
  reasoning: string;
}

export interface FinalPlan {
  primaryAction: string;
  phases: string[];
  resources: ResourceAllocation[];
  routes: Route[];
  shelterAssignments: ShelterAssignment[];
  triageZones: TriageZone[];
}

export interface ShelterAssignment {
  name: string;
  lat: number;
  lng: number;
  capacity: number;
}

export interface TriageZone {
  zone: string;
  priority: 1 | 2 | 3;
  lat: number;
  lng: number;
}

// ─── Agent Run Context ─────────────────────────────────────────────────────

export interface AgentRunContext {
  runId: string;
  incidentId: string;
  incident: IncidentInput;
  round: 1 | 2;
  humanOverride?: string;
}

// ─── Negotiation ───────────────────────────────────────────────────────────

export interface NegotiationQuestion {
  to: AgentId;
  question: string;
  triggeredBy: string; // reason NEXUS is asking
}

export interface NegotiationAnswer {
  agentId: AgentId;
  question: string;
  answer: string;
}

// ─── Demo ──────────────────────────────────────────────────────────────────

export type DemoActionType =
  | 'create_incident'
  | 'trigger_contention'
  | 'inject_weather_alert'
  | 'auto_approve'
  | 'simulate_route_block'
  | 'resolve_incidents';

export interface DemoStep {
  id: string;
  action: DemoActionType;
  payload?: Partial<IncidentInput>;
  resource?: ResourceType;
  incidentIndex?: number; // index into created incidents
  route?: string;
}

// ─── Agent Workspace State (frontend) ─────────────────────────────────────

export type AgentStatus =
  | 'IDLE'
  | 'THINKING'
  | 'WRITING'
  | 'WAITING'
  | 'CHALLENGED'
  | 'REVISING'
  | 'DONE';

export interface AgentWorkspaceState {
  agentId: AgentId;
  status: AgentStatus;
  liveReasoning: string;
  confidence: number;
  urgency: number;
  vote: VoteType | null;
  pendingTasks: string[];
  completedTasks: string[];
  memoryEntriesUsed: number;
  shortTermMemoryInfluence: string | null;
  round: 1 | 2;
  lastUpdated: Date;
}

// ─── Weights (NEXUS formula) ───────────────────────────────────────────────

export const AGENT_WEIGHTS: Record<AgentId, number> = {
  SIGMA:   1.0,
  AXIOM:   1.2,
  HERALD:  0.8,
  AEGIS:   1.1,
  ATLAS:   1.0,
  ARCHIVE: 0.9,
  NEXUS:   0.0, // NEXUS doesn't vote — it decides
};

// Database record & Memory re-exports
import type { AgentVote, AgentMessage, TimelineEntry } from '@prisma/client';
export type AgentVoteRecord = AgentVote;
export type AgentMessageRecord = AgentMessage;
export type TimelineEntryRecord = TimelineEntry;

export type { MemoryEntry } from '@/lib/memory/memory-types';

