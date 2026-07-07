// lib/sse/types.ts
// Server-Sent Events type definitions.

import type { AgentId, AgentStatus, VoteType } from '@/types';

export const SSE_EVENTS = {
  // Connection
  PING:                     'ping',
  RUN_COMPLETE:             'run_complete',

  // Incident lifecycle
  INCIDENT_RECEIVED:        'incident_received',
  REPORT_CLASSIFIED:        'report_classified',
  DUPLICATE_DETECTED:       'duplicate_detected',

  // Debate protocol
  DEBATE_STATEMENT:         'debate_statement',
  DEBATE_CHALLENGE:         'debate_challenge',
  DEBATE_EVIDENCE:          'debate_evidence',
  DEBATE_REVISION:          'debate_revision',
  DEBATE_RULING:            'debate_ruling',

  // Agent round 1
  ROUND_1_START:            'round_1_start',
  AGENT_STATUS:             'agent_status',
  AGENT_THINKING:           'agent_thinking',
  AGENT_REASONING:          'agent_reasoning',
  ROUND_1_VOTE:             'round_1_vote',

  // Interrupt events (any-time)
  WEATHER_ALERT:            'weather_alert',
  RESOURCE_SHORTAGE:        'resource_shortage',
  ROUTE_BLOCKED:            'route_blocked',

  // Shared memory
  SHARED_MEMORY_WRITE:      'shared_memory_write',
  SHARED_MEMORY_CONFLICT:   'shared_memory_conflict',
  SHARED_MEMORY_SNAPSHOT:   'shared_memory_snapshot',

  // Round 2 negotiation
  ROUND_2_START:            'round_2_start',
  NEGOTIATION_QUESTION:     'negotiation_question',
  NEGOTIATION_ANSWER:       'negotiation_answer',
  NEGOTIATION_RESOLVED:     'negotiation_resolved',

  // Decision
  COORDINATOR_DECISION:     'coordinator_decision',
  HUMAN_CHECKPOINT:         'human_checkpoint',
  HUMAN_APPROVED:           'human_approved',
  HUMAN_REJECTED:           'human_rejected',
  HUMAN_OVERRIDE:           'human_override',

  // Deployment
  DEPLOYMENT_STARTED:       'deployment_started',
  DEPLOYMENT_UPDATE:        'deployment_update',
  DEPLOYMENT_COMPLETED:     'deployment_completed',

  // Timeline
  TIMELINE_ENTRY:           'timeline_entry',

  // Multi-incident
  RESOURCE_CONTENTION:      'resource_contention',
  PRIORITY_RESOLVED:        'priority_resolved',

  // Lifecycle & Audit events
  INCIDENT_STATUS_CHANGED:  'incident_status_changed',
  INCIDENT_WITHDRAWN:       'incident_withdrawn',
  CANCELLATION_REQUESTED:   'cancellation_requested',
  CANCELLATION_DECIDED:     'cancellation_decided',
  COMMANDER_ACTION:         'commander_action',
  RESOURCE_RECALLED:        'resource_recalled',
  INCIDENT_ARCHIVED:        'incident_archived',

  // Demo
  DEMO_STARTED:             'demo_started',
  DEMO_STEP:                'demo_step',
  DEMO_COMPLETED:           'demo_completed',
} as const;

export type SSEEventType = typeof SSE_EVENTS[keyof typeof SSE_EVENTS];

export interface AgentSSEEvent {
  type: SSEEventType;
  agentId: AgentId | 'SYSTEM' | 'HUMAN' | 'COMMANDER' | 'CITIZEN';
  incidentId: string;
  runId: string;
  round: 1 | 2;
  timestamp: string; // ISO string
  payload: Record<string, unknown>;
}

// Specific payload types for type-safe event construction

export interface AgentStatusPayload {
  agentId: AgentId;
  status: AgentStatus;
  message?: string;
}

export interface AgentReasoningPayload {
  agentId: AgentId;
  reasoning: string;
  confidence: number;
  urgency: number;
}

export interface DebateMessagePayload {
  fromAgent: AgentId;
  toAgent?: AgentId;
  messageType: string;
  content: string;
  evidenceTier?: 1 | 2 | 3;
  round: 1 | 2;
}

export interface VotePayload {
  agentId: AgentId;
  confidence: number;
  urgency: number;
  vote: VoteType;
  recommendation: string;
  reasoning: string;
  risks: string[];
}

export interface SharedMemoryWritePayload {
  operation: 'add_fact' | 'confirm_fact' | 'challenge_fact' | 'add_evidence' | 'update_route' | 'open_conflict' | 'resolve_conflict';
  agentId: AgentId;
  data: Record<string, unknown>;
}

export interface TimelineEntryPayload {
  agentId: string;
  category: string;
  title: string;
  detail: string;
  severity: string;
}

export interface CoordinatorDecisionPayload {
  overallConfidence: number;
  overallUrgency: number;
  decisionNarrative: string;
  agentConsensus: { agentId: AgentId; vote: VoteType; confidence: number }[];
  humanApprovalRequired: boolean;
  humanCheckpoint: { message: string; summary: string };
}

// Aliases for compatibility
export const EVENTS = SSE_EVENTS;
export type EventType = SSEEventType;

