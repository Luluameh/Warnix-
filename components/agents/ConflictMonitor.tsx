// components/agents/ConflictMonitor.tsx
'use client';

import React from 'react';
import { AgentId, AGENT_META } from '@/types';
import StatusDot from '../layout/StatusDot';

interface ConflictItem {
  id: string;
  between: [AgentId, AgentId];
  claim: string;
  resolved: boolean;
  resolution?: string;
}

interface ConflictMonitorProps {
  conflicts: ConflictItem[];
  hideHeader?: boolean;
}

export const ConflictMonitor: React.FC<ConflictMonitorProps> = ({ conflicts, hideHeader = false }) => {
  const getAgentName = (id: AgentId) => {
    return AGENT_META[id]?.name ?? id;
  };

  const content = (
    <div className="eoc-panel-content" style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '6px', overflowY: 'auto', height: '100%' }}>
      {conflicts.length === 0 ? (
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
          No active cognitive conflicts detected.
        </div>
      ) : (
        conflicts.map(conf => (
          <div
            key={conf.id}
            style={{
              backgroundColor: 'var(--bg-panel-alt)',
              border: `1px solid ${conf.resolved ? 'var(--border)' : 'rgba(252, 129, 129, 0.2)'}`,
              borderRadius: '4px',
              padding: '8px 10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="font-mono" style={{ fontSize: '9px', fontWeight: 700, color: 'var(--status-warn)' }}>
                {getAgentName(conf.between[0])} ✕ {getAgentName(conf.between[1])}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <StatusDot status={conf.resolved ? 'live' : 'crit'} />
                <span className="font-mono" style={{ fontSize: '8px', color: 'var(--text-secondary)' }}>
                  {conf.resolved ? 'RESOLVED' : 'DISPUTED'}
                </span>
              </div>
            </div>

            <p style={{ fontSize: '11px', color: 'var(--text-primary)', fontStyle: 'italic' }}>
              &quot;{conf.claim}&quot;
            </p>

            {conf.resolved && conf.resolution && (
              <div
                style={{
                  marginTop: '4px',
                  paddingTop: '4px',
                  borderTop: '1px solid var(--border)',
                  fontSize: '10px',
                  color: 'var(--status-live)',
                }}
              >
                <span style={{ fontWeight: 600 }}>Nexus Ruling:</span> {conf.resolution}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );

  if (hideHeader) return content;

  return (
    <div className="eoc-panel" style={{ flex: 1 }}>
      <div className="eoc-panel-header">
        <span>Conflict Resolver Monitor</span>
        <span className="font-mono text-cyan" style={{ fontSize: '9px' }}>
          {conflicts.filter(c => !c.resolved).length} active
        </span>
      </div>
      {content}
    </div>
  );
};
export default ConflictMonitor;
