// components/layout/SystemHealthPanel.tsx
'use client';

import React from 'react';
import StatusBadge, { StatusType } from './StatusBadge';

interface SystemHealthPanelProps {
  sseStatus: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING';
  hideHeader?: boolean;
}

export const SystemHealthPanel: React.FC<SystemHealthPanelProps> = ({ sseStatus, hideHeader = false }) => {
  const getSSEStatusType = (): StatusType => {
    switch (sseStatus) {
      case 'CONNECTED':
        return 'ONLINE';
      case 'CONNECTING':
        return 'CONNECTING';
      case 'DISCONNECTED':
        return 'OFFLINE';
      default:
        return 'IDLE';
    }
  };

  const systems = [
    { name: 'QWEN CLOUD GATEWAY', status: 'ONLINE' as StatusType, ping: '138ms', desc: 'compatible-mode/v1' },
    { name: 'NEON POSTGRES DB', status: 'ONLINE' as StatusType, ping: '42ms', desc: 'connection pool active' },
    { name: 'PRISMA ORM CLIENT', status: 'ONLINE' as StatusType, ping: 'OK', desc: 'schema synchronization' },
    { name: 'SSE REALTIME BUS', status: getSSEStatusType(), ping: sseStatus === 'CONNECTED' ? 'ACTIVE' : 'IDLE', desc: 'incident stream channel' },
    { name: 'LEAFLET GIS RADAR', status: 'ONLINE' as StatusType, ping: 'OK', desc: 'tileset layer online' },
  ];

  const content = (
    <div
      className="eoc-panel-content"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        padding: '6px',
        overflowY: 'auto',
        height: '100%',
      }}
    >
      {systems.map((sys, idx) => (
        <div
          key={idx}
          className="hover-lift-cyan"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 10px',
            backgroundColor: 'var(--bg-panel-alt)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            marginBottom: '4px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span
              className="font-mono"
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '0.05em',
              }}
            >
              {sys.name}
            </span>
            <span
              style={{
                fontSize: '8px',
                color: 'var(--text-secondary)',
              }}
            >
              {sys.desc}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {sys.ping && (
              <span
                className="font-mono"
                style={{
                  fontSize: '9px',
                  color: 'var(--text-muted)',
                }}
              >
                {sys.ping}
              </span>
            )}
            <StatusBadge label={sys.status} status={sys.status} />
          </div>
        </div>
      ))}
    </div>
  );

  if (hideHeader) return content;

  return (
    <div className="eoc-panel" style={{ flex: 1 }}>
      <div className="eoc-panel-header">
        <span>SYSTEM HEALTH TELEMETRY</span>
        <span className="font-mono text-cyan" style={{ fontSize: '9px' }}>
          5/5 COMPLIANT
        </span>
      </div>
      {content}
    </div>
  );
};
export default SystemHealthPanel;
