// app/dashboard/page.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import type {
  IncidentRecord,
  ResourceRecord,
  AgentVoteRecord,
  AgentMessageRecord,
  TimelineEntryRecord,
  CoordinatorDecision,
  AgentId,
} from '@/types';
import { TopBar } from '@/components/layout/TopBar';
import { GridBody } from '@/components/layout/GridLayout';
import { IncidentQueue } from '@/components/incidents/IncidentQueue';
import { NewIncidentForm } from '@/components/incidents/NewIncidentForm';
import { AgentRoster } from '@/components/agents/AgentRoster';
import { AgentWorkspace } from '@/components/agents/AgentWorkspace';
import { AgentDebateChat } from '@/components/agents/AgentDebateChat';
import { ConflictMonitor } from '@/components/agents/ConflictMonitor';
import { SharedMemoryPanel } from '@/components/memory/SharedMemoryPanel';
import { HistoricalMemoryPanel } from '@/components/memory/HistoricalMemoryPanel';
import { ResourcePanel } from '@/components/resources/ResourcePanel';
import { IncidentTimeline } from '@/components/timeline/IncidentTimeline';
import { XAIPanel } from '@/components/explainability/XAIPanel';
import { CommanderToolbar } from '@/components/human/CommanderToolbar';
import { DemoButton } from '@/components/demo/DemoButton';
import { SSE_EVENTS } from '@/lib/sse/types';
import dynamic from 'next/dynamic';
import ErrorBoundary from '@/components/error-boundary';

const DisasterMap = dynamic(() => import('@/components/map/DisasterMap'), { ssr: false });
import 'leaflet/dist/leaflet.css';

export default function MissionControlPage() {
  // ─── State ─────────────────────────────────────────────────────────
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [resources, setResources] = useState<ResourceRecord[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);

  // Active run state
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [runStatus, setRunStatus] = useState<string | null>(null);
  const [agentStatuses, setAgentStatuses] = useState<Record<string, any>>({});
  const [votes, setVotes] = useState<AgentVoteRecord[]>([]);
  const [debateMessages, setDebateMessages] = useState<AgentMessageRecord[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntryRecord[]>([]);
  const [facts, setFacts] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [shortages, setShortages] = useState<any[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [precedents, setPrecedents] = useState<any[]>([]);
  const [decision, setDecision] = useState<CoordinatorDecision | null>(null);

  // UI state
  const [showNewIncidentForm, setShowNewIncidentForm] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<AgentId | null>(null);
  const [sseStatus, setSseStatus] = useState<'CONNECTED' | 'DISCONNECTED' | 'CONNECTING'>('DISCONNECTED');

  const sseRef = useRef<EventSource | null>(null);
  const activeRunIdRef = useRef<string | null>(null);

  // ─── Fetch data on mount ───────────────────────────────────────────
  const fetchData = async () => {
    try {
      const incRes = await fetch('/api/incidents');
      if (incRes.ok) {
        const data = await incRes.json();
        setIncidents(data);
      }
      const resRes = await fetch('/api/resources');
      if (resRes.ok) {
        const data = await resRes.json();
        setResources(data);
      }
    } catch (err) {
      console.error('Failed to fetch initial EOC stats:', err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 6000);
    return () => clearInterval(interval);
  }, []);

  // Selected incident reference
  const selectedIncident = incidents.find(i => i.id === selectedIncidentId) || null;

  // Check if selected incident has any pending cancellation requests
  const hasCancellationRequest = !!(selectedIncident as any)?.citizenReport?.cancellationRequests?.some(
    (req: any) => req.status === 'PENDING'
  );

  // ─── Watch selected incident updates ───────────────────────────────
  const handleSelectIncident = async (id: string) => {
    setSelectedIncidentId(id);
    setDebateMessages([]);
    setTimeline([]);
    setFacts([]);
    setRoutes([]);
    setShortages([]);
    setConflicts([]);
    setPrecedents([]);
    setDecision(null);
    setRunStatus(null);
    setAgentStatuses({});
    setVotes([]);

    try {
      const res = await fetch(`/api/incidents/${id}`);
      if (!res.ok) return;
      const data = await res.json();

      // Set historical timelines
      setTimeline(data.timeline ?? []);

      // If active runs exist, display the most recent run details
      const runs = data.agentRuns ?? [];
      const mostRecent = runs[0];
      if (mostRecent) {
        setActiveRunId(mostRecent.id);
        setRunStatus(mostRecent.status);
        setVotes(mostRecent.votes ?? []);
        
        // Rebuild historical messages list
        const histMsgs = (mostRecent.messages ?? []).map((m: any) => ({
          id: m.id,
          agentRunId: m.agentRunId,
          incidentId: m.incidentId,
          fromAgent: m.fromAgent,
          toAgent: m.toAgent ?? null,
          messageType: m.messageType,
          content: m.content,
          reasoning: m.reasoning ?? null,
          evidenceTier: m.evidenceTier ?? null,
          round: m.round,
          timestamp: new Date(m.timestamp),
        }));
        setDebateMessages(histMsgs);

        // Load final decision if available
        if (mostRecent.finalDecision) {
          const dec = mostRecent.finalDecision as CoordinatorDecision;
          setDecision(dec);
          if (dec.historicalPrecedent) {
            setPrecedents([{
              title: dec.historicalPrecedent,
              year: 2021,
              location: 'Historical database',
              similarity_score: 0.85,
              summary: 'Matching precedent referenced by ARCHIVE.',
              lessons_learned: ['Coordinate resources early'],
            }]);
          }
        }
      }
    } catch (err) {
      console.error('Failed to retrieve incident logs:', err);
    }
  };

  // ─── Connect to Server Sent Events stream ──────────────────────────
  useEffect(() => {
    if (!activeRunId) {
      if (sseRef.current) {
        sseRef.current.close();
        setSseStatus('DISCONNECTED');
      }
      return;
    }

    if (activeRunId === activeRunIdRef.current && sseRef.current) {
      return; // Already listening to this stream
    }

    // Close prior connection
    if (sseRef.current) {
      sseRef.current.close();
    }

    activeRunIdRef.current = activeRunId;
    setSseStatus('CONNECTING');

    const streamUrl = `/api/stream/${activeRunId}`;
    const source = new EventSource(streamUrl);
    sseRef.current = source;

    source.onopen = () => {
      setSseStatus('CONNECTED');
    };

    source.onerror = () => {
      setSseStatus('DISCONNECTED');
    };

    // Wildcard event handler for all EOC events
    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const payload = data.payload;

        // Process status changes, cancellation, withdrawals, and commands globally (some may have null runId)
        if (data.type === SSE_EVENTS.INCIDENT_STATUS_CHANGED && data.incidentId === selectedIncidentId) {
          fetchData();
          if (selectedIncidentId) {
            handleSelectIncident(selectedIncidentId);
          }
          return;
        }

        // Ensure we only process detailed agent events for our active run
        if (data.runId && data.runId !== activeRunId) return;

        switch (data.type) {
          case SSE_EVENTS.RUN_COMPLETE:
            setRunStatus(payload.status);
            fetchData(); // Refresh resources states
            break;

          case SSE_EVENTS.ROUND_1_START:
            setRunStatus('RUNNING');
            setAgentStatuses({});
            setVotes([]);
            setFacts([]);
            setRoutes([]);
            setShortages([]);
            setConflicts([]);
            setDecision(null);
            break;

          case SSE_EVENTS.AGENT_STATUS:
            setAgentStatuses(prev => ({
              ...prev,
              [payload.agentId]: {
                agentId: payload.agentId,
                status: payload.status,
                message: payload.message,
              },
            }));
            break;

          case SSE_EVENTS.AGENT_REASONING:
            setAgentStatuses(prev => ({
              ...prev,
              [payload.agentId]: {
                ...prev[payload.agentId],
                confidence: payload.confidence,
                urgency: payload.urgency,
              },
            }));
            break;

          case SSE_EVENTS.ROUND_1_VOTE:
            const newVote: AgentVoteRecord = {
              id: data.agentId + '-' + Date.now(),
              agentRunId: data.runId,
              incidentId: data.incidentId,
              agentId: payload.agentId,
              round: data.round,
              confidence: payload.confidence,
              urgency: payload.urgency,
              vote: payload.vote,
              recommendation: payload.recommendation,
              reasoning: payload.reasoning,
              risks: payload.risks ?? [],
              memoryUsed: false,
              memoryInfluence: null,
              rawOutput: null,
              detectedAt: new Date(data.timestamp),
            };
            setVotes(prev => [...prev, newVote]);
            break;

          case SSE_EVENTS.DEBATE_STATEMENT:
          case SSE_EVENTS.DEBATE_CHALLENGE:
          case SSE_EVENTS.DEBATE_EVIDENCE:
          case SSE_EVENTS.DEBATE_REVISION:
          case SSE_EVENTS.DEBATE_RULING:
          case SSE_EVENTS.NEGOTIATION_QUESTION:
          case SSE_EVENTS.NEGOTIATION_ANSWER:
            const newMsg: AgentMessageRecord = {
              id: payload.id ?? String(Date.now()),
              agentRunId: data.runId,
              incidentId: data.incidentId,
              fromAgent: data.agentId,
              toAgent: payload.toAgent ?? null,
              messageType: payload.messageType ?? 'STATEMENT',
              content: payload.content ?? payload.question ?? payload.answer,
              reasoning: payload.reasoning ?? null,
              evidenceTier: payload.evidenceTier ?? null,
              round: data.round,
              timestamp: new Date(data.timestamp),
            };
            setDebateMessages(prev => [...prev, newMsg]);
            break;

          case SSE_EVENTS.TIMELINE_ENTRY:
            const newTimeline: TimelineEntryRecord = {
              id: String(Date.now() + Math.random()),
              incidentId: data.incidentId,
              agentId: data.agentId,
              category: payload.category,
              title: payload.title,
              detail: payload.detail,
              severity: payload.severity,
              timestamp: new Date(),
            };
            setTimeline(prev => [...prev, newTimeline]);
            break;

          case SSE_EVENTS.SHARED_MEMORY_WRITE:
            const op = payload.operation;
            const item = payload.data;
            if (op === 'add_fact') {
              setFacts(prev => [...prev, {
                id: item.factId,
                claim: item.claim,
                addedBy: item.agentId,
                confirmedBy: [],
                challengedBy: [],
                evidenceTier: item.tier,
                status: 'DISPUTED',
              }]);
            } else if (op === 'confirm_fact') {
              setFacts(prev => prev.map(f => {
                if (f.id !== item.factId) return f;
                const confs = f.confirmedBy.includes(item.agentId) ? f.confirmedBy : [...f.confirmedBy, item.agentId];
                return {
                  ...f,
                  confirmedBy: confs,
                  status: confs.length >= 2 ? 'CONFIRMED' : f.status,
                };
              }));
            } else if (op === 'challenge_fact') {
              setFacts(prev => prev.map(f => {
                if (f.id !== item.factId) return f;
                return {
                  ...f,
                  challengedBy: f.challengedBy.includes(item.agentId) ? f.challengedBy : [...f.challengedBy, item.agentId],
                  status: 'DISPUTED',
                };
              }));
            } else if (op === 'update_route') {
              setRoutes(prev => {
                const idx = prev.findIndex(r => r.id === item.routeId);
                const newRoute = {
                  id: item.routeId,
                  name: item.name,
                  status: item.status,
                  blockedBy: item.blockedBy,
                  blockedReason: item.reason,
                };
                if (idx >= 0) {
                  const updated = [...prev];
                  updated[idx] = newRoute;
                  return updated;
                }
                return [...prev, newRoute];
              });
            } else if (op === 'open_conflict') {
              setConflicts(prev => [...prev, {
                id: item.conflictId,
                between: item.between,
                claim: item.claim,
                resolved: false,
              }]);
            } else if (op === 'resolve_conflict') {
              setConflicts(prev => prev.map(c => {
                if (c.id !== item.conflictId) return c;
                return { ...c, resolved: true, resolution: item.resolution };
              }));
            }
            break;

          case SSE_EVENTS.RESOURCE_SHORTAGE:
            setShortages(prev => [...prev, {
              type: payload.type,
              deficit: payload.deficit,
              affected: payload.affected,
              mitigation: payload.mitigation,
            }]);
            break;

          case SSE_EVENTS.WEATHER_ALERT:
            setTimeline(prev => [...prev, {
              id: String(Date.now()),
              incidentId: data.incidentId,
              agentId: 'HERALD',
              category: 'WEATHER',
              title: 'Weather Hazard Warning',
              detail: `Hazard conditions: ${payload.condition}. Response routes ETA impact expected.`,
              severity: 'WARNING',
              timestamp: new Date(),
            }]);
            break;

          case SSE_EVENTS.ROUTE_BLOCKED:
            setRoutes(prev => {
              const idx = prev.findIndex(r => r.id === payload.routeId);
              const blockedRoute = {
                id: payload.routeId,
                name: payload.name,
                status: 'BLOCKED' as const,
                blockedBy: payload.reportedBy,
                blockedReason: payload.reason,
              };
              if (idx >= 0) {
                const updated = [...prev];
                updated[idx] = blockedRoute;
                return updated;
              }
              return [...prev, blockedRoute];
            });
            break;

          case SSE_EVENTS.COORDINATOR_DECISION:
            setDecision(payload);
            setRunStatus('AWAITING_HUMAN');
            if (payload.historicalPrecedent) {
              setPrecedents([{
                title: payload.historicalPrecedent,
                year: 2021,
                location: 'EOC Archives',
                similarity_score: 0.85,
                summary: 'Matching precedent selected by ARCHIVE.',
                lessons_learned: ['Apply lessons learned to evacuation routes'],
              }]);
            }
            break;

          case SSE_EVENTS.HUMAN_APPROVED:
            setRunStatus('COMPLETED');
            fetchData();
            break;

          case SSE_EVENTS.HUMAN_REJECTED:
            setRunStatus('FAILED');
            break;
        }
      } catch (err) {
        console.error('Error parsing SSE event data:', err);
      }
    };

    return () => {
      if (sseRef.current) {
        sseRef.current.close();
      }
    };
  }, [activeRunId, selectedIncidentId]);

  const handleCreateIncident = async (newIncidentData: any) => {
    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIncidentData),
      });

      if (!res.ok) throw new Error('Failed to register incident');

      const data = await res.json();
      setShowNewIncidentForm(false);
      
      // Update incident registry and select new one
      setIncidents(prev => [data.incident, ...prev]);
      setSelectedIncidentId(data.incident.id);
      setActiveRunId(data.runId);
      setRunStatus('RUNNING');
      
      // Reset current active states
      setDebateMessages([]);
      setTimeline([]);
      setFacts([]);
      setRoutes([]);
      setShortages([]);
      setConflicts([]);
      setPrecedents([]);
      setDecision(null);
      setVotes([]);
      setAgentStatuses({});
    } catch (err) {
      console.error(err);
      alert('Error logging incident in EOC registry.');
    }
  };

  // ─── Citizen Withdrawal & Cancellation Actions ──────────────────
  const handleWithdrawReport = async (id: string, reason: string) => {
    try {
      const res = await fetch(`/api/incidents/${id}/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        fetchData();
        if (selectedIncidentId === id) {
          handleSelectIncident(id);
        }
      } else {
        const errData = await res.json();
        alert(`Withdrawal failed: ${errData.error}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRequestCancellation = async (id: string, reason: string) => {
    try {
      const res = await fetch(`/api/incidents/${id}/cancel-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        fetchData();
        if (selectedIncidentId === id) {
          handleSelectIncident(id);
        }
        alert('Cancellation request submitted to EOC Commander.');
      } else {
        const errData = await res.json();
        alert(`Cancellation request failed: ${errData.error}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ─── EOC Commander Actions ─────────────────────────────────────────

  const handleApprovePlan = async () => {
    if (!selectedIncidentId) return;
    try {
      const res = await fetch(`/api/incidents/${selectedIncidentId}/approve`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchData();
        handleSelectIncident(selectedIncidentId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectPlan = async () => {
    if (!selectedIncidentId) return;
    try {
      const res = await fetch(`/api/incidents/${selectedIncidentId}/reject`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchData();
        handleSelectIncident(selectedIncidentId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOverridePlan = async (instruction: string) => {
    if (!selectedIncidentId) return;
    try {
      const res = await fetch(`/api/incidents/${selectedIncidentId}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction }),
      });
      if (res.ok) {
        const data = await res.json();
        setActiveRunId(data.runId);
        setRunStatus('RUNNING');
        setDebateMessages([]);
        setDecision(null);
        setVotes([]);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRecallResources = async () => {
    if (!selectedIncidentId) return;
    try {
      const res = await fetch(`/api/incidents/${selectedIncidentId}/recall`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchData();
        handleSelectIncident(selectedIncidentId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveIncident = async () => {
    if (!selectedIncidentId) return;
    try {
      const res = await fetch(`/api/incidents/${selectedIncidentId}/resolve`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchData();
        handleSelectIncident(selectedIncidentId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchiveIncident = async () => {
    if (!selectedIncidentId) return;
    try {
      const res = await fetch(`/api/incidents/${selectedIncidentId}/archive`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchData();
        handleSelectIncident(selectedIncidentId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkDuplicate = async (parentId?: string) => {
    if (!selectedIncidentId) return;
    try {
      const res = await fetch(`/api/incidents/${selectedIncidentId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId }),
      });
      if (res.ok) {
        fetchData();
        handleSelectIncident(selectedIncidentId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkFalseAlarm = async () => {
    if (!selectedIncidentId) return;
    try {
      const res = await fetch(`/api/incidents/${selectedIncidentId}/false-alarm`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchData();
        handleSelectIncident(selectedIncidentId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveCancellation = async () => {
    if (!selectedIncidentId) return;
    try {
      const res = await fetch(`/api/incidents/${selectedIncidentId}/cancel-approve`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchData();
        handleSelectIncident(selectedIncidentId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleContinueInvestigation = async () => {
    if (!selectedIncidentId) return;
    try {
      const res = await fetch(`/api/incidents/${selectedIncidentId}/cancel-continue`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchData();
        handleSelectIncident(selectedIncidentId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Get selected agent's vote details
  const getSelectedAgentVote = () => {
    if (!selectedAgentId) return null;
    return votes.find(v => v.agentId === selectedAgentId) ?? null;
  };

  // Active operations counter (non-withdrawn/archived/false alarms/duplicates)
  const activeCount = incidents.filter(i => 
    !['WITHDRAWN', 'ARCHIVED', 'FALSE_ALARM', 'DUPLICATE', 'RESOLVED'].includes(i.status)
  ).length;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        backgroundColor: 'var(--bg-base)',
      }}
    >
      {/* Header bar */}
      <TopBar
        activeCount={activeCount}
        totalCount={incidents.length}
        sseStatus={sseStatus}
      />

      {/* Grid Dashboard Layout */}
      <GridBody>
        <ErrorBoundary>
          {/* Left Column (Incident Queue + Resource card registry) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden' }}>
            <IncidentQueue
              incidents={incidents}
              selectedId={selectedIncidentId}
              onSelect={handleSelectIncident}
              onNewIncidentClick={() => setShowNewIncidentForm(true)}
              onWithdrawReport={handleWithdrawReport}
              onRequestCancellation={handleRequestCancellation}
            />
            <ResourcePanel resources={resources} />
          </div>

          {/* Center Column (Agent Society debate chat + decision synthesis) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden' }}>
            {/* Mock EOC visual panel / map display */}
            <div
              className="eoc-panel"
              style={{
                flex: 1.2,
                backgroundColor: '#0F1115',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '12px',
              }}
            >
              {/* Header info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span className="font-mono text-cyan glow-cyan" style={{ fontSize: '12px', fontWeight: 700 }}>
                    🛰️ WARNIX GEOSPATIAL RADAR
                  </span>
                  <p style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Viewport coordinates locked onto emergency zone. Map render pending Leaflet initialization.
                  </p>
                </div>
                <DemoButton
                  demoRunId={activeRunId ?? 'demo-runner-id'}
                  onDemoStarted={async (incId, runId) => {
                    setTimeout(async () => {
                      await handleSelectIncident(incId);
                    }, 1000);
                  }}
                />
              </div>

              {/* Interactive Leaflet Disaster Map Panel */}
              <div
                style={{
                  flex: 1.5,
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  margin: '8px 0',
                  overflow: 'hidden',
                  position: 'relative',
                  minHeight: '260px',
                  backgroundColor: 'var(--bg-base)',
                }}
              >
                <DisasterMap
                  incidents={incidents}
                  resources={resources}
                  selectedIncidentId={selectedIncidentId}
                  routes={routes}
                />
              </div>

              {/* Commander Controls Loop */}
              <CommanderToolbar
                runStatus={runStatus}
                incidentStatus={selectedIncident ? selectedIncident.status : null}
                checkpointMessage={decision?.humanCheckpoint?.message ?? null}
                hasCancellationRequest={hasCancellationRequest}
                onApprove={handleApprovePlan}
                onReject={handleRejectPlan}
                onOverride={handleOverridePlan}
                onRecall={handleRecallResources}
                onResolve={handleResolveIncident}
                onArchive={handleArchiveIncident}
                onMarkDuplicate={handleMarkDuplicate}
                onMarkFalseAlarm={handleMarkFalseAlarm}
                onApproveCancellation={handleApproveCancellation}
                onContinueInvestigation={handleContinueInvestigation}
              />
            </div>

            {/* Bottom Debate chat panel */}
            <AgentDebateChat messages={debateMessages} />
          </div>

          {/* Right Column (Agent Workspace profile + explainability metrics) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', flex: 1.2, gap: '4px' }}>
              <AgentRoster
                statuses={agentStatuses}
                selectedAgentId={selectedAgentId}
                onSelectAgent={setSelectedAgentId}
              />
              <AgentWorkspace
                agentId={selectedAgentId}
                vote={getSelectedAgentVote()}
                shortTermMemories={selectedAgentId ? [] : []} // Can pull rolling memories if available
              />
            </div>
            <XAIPanel decision={decision} />
          </div>

          {/* Bottom row (Shared Memory Facts pool + Incident Timeline logs) */}
          <div style={{ gridColumn: '1 / span 3', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', overflow: 'hidden' }}>
            <SharedMemoryPanel facts={facts} routes={routes} shortages={shortages} />
            <ConflictMonitor conflicts={conflicts} />
            <IncidentTimeline timeline={timeline} />
          </div>
        </ErrorBoundary>
      </GridBody>

      {/* Report emergency form overlay */}
      {showNewIncidentForm && (
        <NewIncidentForm
          onClose={() => setShowNewIncidentForm(false)}
          onSubmit={handleCreateIncident}
        />
      )}
    </div>
  );
}
