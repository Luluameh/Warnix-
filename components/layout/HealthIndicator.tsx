// components/layout/HealthIndicator.tsx
import React from 'react';
import StatusBadge, { StatusType } from './StatusBadge';

interface HealthIndicatorProps {
  name: string;
  status: StatusType;
  ping?: string;
}

export const HealthIndicator: React.FC<HealthIndicatorProps> = ({ name, status, ping }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px 8px',
        backgroundColor: 'rgba(0, 0, 0, 0.15)',
        border: '1px solid var(--border)',
        borderRadius: '3px',
      }}
    >
      <span className="font-mono text-cyan" style={{ fontSize: '10px' }}>
        {name}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {ping && (
          <span className="font-mono" style={{ fontSize: '8px', color: 'var(--text-muted)' }}>
            {ping}
          </span>
        )}
        <StatusBadge label={status} status={status} />
      </div>
    </div>
  );
};
export default HealthIndicator;
