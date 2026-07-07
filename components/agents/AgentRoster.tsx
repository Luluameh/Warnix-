// components/agents/AgentRoster.tsx
'use client';

import React from 'react';
import { AgentId, AGENT_META, SPECIALIST_AGENT_IDS } from '@/types';
import StatusDot from '../layout/StatusDot';

interface AgentStatusInfo {
  agentId: AgentId;
  status: 'IDLE' | 'THINKING' | 'DONE' | 'WAITING' | 'FAILED';
  confidence: number | null;
  urgency: number | null;
  message?: string;
}

interface AgentRosterProps {
  statuses: Record<AgentId, AgentStatusInfo>;
  selectedAgentId: AgentId | null;
  onSelectAgent: (id: AgentId) => void;
}

export const AgentRoster: React.FC<AgentRosterProps> = ({
  statuses,
  selectedAgentId,
  onSelectAgent,
}) => {
  const getStatusColorClass = (status: string) => {
    switch (status) {
      case 'THINKING': return 'warn';
      case 'DONE': return 'live';
      case 'WAITING': return 'live';
      case 'FAILED': return 'crit';
      default: return 'idle';
    }
  };

  const getAgentColor = (id: AgentId) => {
    switch (id) {
      case AgentId.SIGMA: return 'var(--sigma)';
      case AgentId.AXIOM: return 'var(--axiom)';
      case AgentId.HERALD: return 'var(--herald)';
      case AgentId.AEGIS: return 'var(--aegis)';
      case AgentId.ATLAS: return 'var(--atlas)';
      case AgentId.ARCHIVE: return 'var(--archive)';
      case AgentId.NEXUS: return 'var(--nexus)';
      default: return 'var(--text-secondary)';
    }
  };

  // Nexus first, then specialists in order
  const order = [AgentId.NEXUS, ...SPECIALIST_AGENT_IDS];

  return (
    <div className="eoc-panel" style={{ flex: 1 }}>
      <div className="eoc-panel-header">
        <span>Agent Society Roster</span>
        <span className="font-mono text-cyan" style={{ fontSize: '9px' }}>
          7 autonomous
        </span>
      </div>

      <div className="eoc-panel-content" style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '6px' }}>
        {order.map(id => {
          const meta = AGENT_META[id];
          const info = statuses[id] || { agentId: id, status: 'IDLE', confidence: null, urgency: null };
          const isSelected = selectedAgentId === id;

          return (
            <div
              key={id}
              onClick={() => onSelectAgent(id)}
              style={{
                backgroundColor: isSelected ? 'var(--bg-selected)' : 'var(--bg-panel)',
                border: `1px solid ${isSelected ? 'var(--accent-dim)' : 'var(--border)'}`,
                borderRadius: '4px',
                padding: '8px 10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'background-color 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '3px',
                    height: '24px',
                    backgroundColor: getAgentColor(id),
                    borderRadius: '2px',
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {meta.name}
                  </span>
                  <span className="font-mono" style={{ fontSize: '8px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {meta.role}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {info.confidence !== null && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: '8px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Conf</span>
                    <span className="font-mono" style={{ fontSize: '10px', color: 'var(--text-primary)', fontWeight: 700 }}>
                      {Math.round(info.confidence * 100)}%
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '64px', justifyContent: 'flex-end' }}>
                  <StatusDot status={getStatusColorClass(info.status)} />
                  <span className="font-mono" style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                    {info.status}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default AgentRoster;
