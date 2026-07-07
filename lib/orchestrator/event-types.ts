// lib/orchestrator/event-types.ts
// Re-export of event keys to keep imports clean.

export { EVENTS } from '@/lib/sse/types';
export type { EventType } from '@/lib/sse/types';
export type { AgentSSEEvent } from '@/lib/sse/types';
export type { AgentStatusPayload, AgentReasoningPayload, VotePayload, DebateMessagePayload, SharedMemoryWritePayload, TimelineEntryPayload, CoordinatorDecisionPayload } from '@/lib/sse/types';
