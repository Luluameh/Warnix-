// components/resources/ResourceCard.tsx
import React from 'react';
import type { ResourceRecord } from '@/types';
import StatusDot from '../layout/StatusDot';

interface ResourceCardProps {
  resource: ResourceRecord;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ resource }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'live';
      case 'DEPLOYED': return 'warn';
      case 'MAINTENANCE': return 'crit';
      default: return 'idle';
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-panel-alt)',
        border: '1px solid var(--border)',
        borderRadius: '3px',
        padding: '6px 8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '11px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          className="font-mono"
          style={{
            fontWeight: 700,
            color: 'var(--accent)',
            backgroundColor: 'rgba(0, 212, 255, 0.05)',
            border: '1px solid var(--border)',
            padding: '2px 4px',
            borderRadius: '2px',
            fontSize: '9px',
          }}
        >
          {resource.callSign}
        </div>
        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
          {resource.name}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <StatusDot status={getStatusColor(resource.status)} />
        <span className="font-mono" style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>
          {resource.status}
        </span>
      </div>
    </div>
  );
};
export default ResourceCard;
