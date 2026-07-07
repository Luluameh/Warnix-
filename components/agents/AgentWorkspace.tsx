// components/agents/AgentWorkspace.tsx
'use client';

import React from 'react';
import { AgentId, AGENT_META, type AgentVoteRecord, type MemoryEntry } from '@/types';

interface AgentWorkspaceProps {
  agentId: AgentId | null;
  vote: AgentVoteRecord | null;
  shortTermMemories: MemoryEntry[];
}

export const AgentWorkspace: React.FC<AgentWorkspaceProps> = ({
  agentId,
  vote,
  shortTermMemories,
}) => {
  if (!agentId) {
    return (
      <div className="eoc-panel" style={{ flex: 1 }}>
        <div className="eoc-panel-header">
          <span>Agent Workspace</span>
        </div>
        <div className="eoc-panel-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
          Select an agent from the roster to view active workspace.
        </div>
      </div>
    );
  }

  const meta = AGENT_META[agentId];

  const getVoteColor = (v: string) => {
    switch (v) {
      case 'AGREE': return 'var(--status-live)';
      case 'PARTIAL': return 'var(--status-warn)';
      case 'DISAGREE': return 'var(--status-crit)';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div className="eoc-panel" style={{ flex: 1 }}>
      <div className="eoc-panel-header">
        <span>Workspace — {meta.name}</span>
        <span className="font-mono text-cyan" style={{ fontSize: '9px' }}>
          {meta.role}
        </span>
      </div>

      <div className="eoc-panel-content" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Profile Card */}
        <div
          style={{
            backgroundColor: 'var(--bg-panel-alt)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            padding: '10px',
          }}
        >
          <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '4px' }}>
            System Persona
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-primary)', lineHeight: '1.4' }}>
            {meta.personality}
          </p>
        </div>

        {/* Current Decision Output */}
        {vote ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--border)',
                paddingBottom: '4px',
              }}
            >
              <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Deliberation Vote
              </span>
              <span
                className="font-mono"
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: getVoteColor(vote.vote),
                  letterSpacing: '0.05em',
                }}
              >
                {vote.vote}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ backgroundColor: 'var(--bg-panel-alt)', padding: '6px 8px', borderRadius: '3px', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '8px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Confidence</span>
                <div className="font-mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent)' }}>
                  {Math.round(vote.confidence * 100)}%
                </div>
              </div>
              <div style={{ backgroundColor: 'var(--bg-panel-alt)', padding: '6px 8px', borderRadius: '3px', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '8px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Urgency Metric</span>
                <div className="font-mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--status-warn)' }}>
                  {Math.round(vote.urgency * 100)}%
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Recommendation</span>
              <p style={{ fontSize: '11px', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                {vote.recommendation}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Reasoning Path</span>
              <p style={{ fontSize: '11px', color: 'var(--text-primary)', lineHeight: '1.4', fontStyle: 'italic' }}>
                {vote.reasoning}
              </p>
            </div>

            {vote.risks.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Identified Risks</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {vote.risks.map((risk: string, index: number) => (
                    <div key={index} style={{ fontSize: '10px', color: 'var(--status-crit)', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                      <span>•</span>
                      <span>{risk}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              padding: '16px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '11px',
              border: '1px dashed var(--border)',
              borderRadius: '4px',
            }}
          >
            No active run votes logged for this agent.
          </div>
        )}

        {/* Private Short-Term Memory */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
          <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Short-Term Memory Recall (Session)
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {shortTermMemories.length === 0 ? (
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Memory buffer empty. Awaiting observations.
              </div>
            ) : (
              shortTermMemories.map((entry, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: 'var(--bg-panel-alt)',
                    border: '1px solid var(--border)',
                    borderRadius: '3px',
                    padding: '6px 8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: 'var(--text-secondary)' }}>
                    <span>INCIDENT: {entry.incidentId.slice(-6)}</span>
                    <span>CONF: {Math.round(entry.confidence * 100)}%</span>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-primary)', marginTop: '2px' }}>
                    {entry.observation}
                  </div>
                  {entry.outcome && (
                    <div style={{ fontSize: '9px', color: 'var(--status-live)', marginTop: '2px' }}>
                      Outcome: {entry.outcome}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default AgentWorkspace;
