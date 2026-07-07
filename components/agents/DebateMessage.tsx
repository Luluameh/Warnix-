// components/agents/DebateMessage.tsx
import React from 'react';
import { AgentId, AGENT_META, type AgentMessageRecord } from '@/types';

interface DebateMessageProps {
  message: AgentMessageRecord;
}

export const DebateMessage: React.FC<DebateMessageProps> = ({ message }) => {
  const getAgentColor = (sender: string) => {
    switch (sender) {
      case AgentId.SIGMA: return 'var(--sigma)';
      case AgentId.AXIOM: return 'var(--axiom)';
      case AgentId.HERALD: return 'var(--herald)';
      case AgentId.AEGIS: return 'var(--aegis)';
      case AgentId.ATLAS: return 'var(--atlas)';
      case AgentId.ARCHIVE: return 'var(--archive)';
      case AgentId.NEXUS: return 'var(--nexus)';
      case 'HUMAN': return 'var(--status-crit)';
      default: return 'var(--text-secondary)';
    }
  };

  const getMsgTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'CHALLENGE': return { color: 'var(--status-crit)', bg: 'rgba(252, 129, 129, 0.1)' };
      case 'EVIDENCE': return { color: 'var(--accent)', bg: 'rgba(0, 212, 255, 0.1)' };
      case 'REVISION': return { color: 'var(--status-warn)', bg: 'rgba(236, 201, 75, 0.1)' };
      case 'RULING': return { color: 'var(--status-live)', bg: 'rgba(72, 187, 120, 0.1)' };
      default: return { color: 'var(--text-secondary)', bg: 'var(--bg-panel-alt)' };
    }
  };

  const badge = getMsgTypeBadgeColor(message.messageType);
  const color = getAgentColor(message.fromAgent);
  const name = message.fromAgent === 'HUMAN' ? 'COMMANDER' :
               message.fromAgent === 'SYSTEM' ? 'SYSTEM' :
               AGENT_META[message.fromAgent as AgentId]?.name ?? message.fromAgent;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        borderBottom: '1px solid var(--border)',
        padding: '6px 8px',
        fontSize: '11px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            className="font-mono"
            style={{
              fontWeight: 700,
              color: color,
              letterSpacing: '0.05em',
            }}
          >
            {name}
          </span>
          <span
            className="font-mono"
            style={{
              fontSize: '8px',
              padding: '1px 5px',
              borderRadius: '2px',
              fontWeight: 700,
              color: badge.color,
              backgroundColor: badge.bg,
              letterSpacing: '0.05em',
            }}
          >
            {message.messageType}
          </span>
          {message.toAgent && (
            <span className="font-mono" style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>
              ➔ {AGENT_META[message.toAgent as AgentId]?.name ?? message.toAgent}
            </span>
          )}
        </div>
        <span className="font-mono" style={{ fontSize: '8px', color: 'var(--text-muted)' }}>
          R{message.round} · {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </div>

      <p style={{ color: 'var(--text-primary)', lineHeight: '1.4', marginTop: '2px' }}>
        {message.content}
      </p>

      {message.reasoning && (
        <p style={{ color: 'var(--text-secondary)', fontSize: '10px', fontStyle: 'italic', marginTop: '2px' }}>
          Reasoning: {message.reasoning}
        </p>
      )}
    </div>
  );
};
export default DebateMessage;
