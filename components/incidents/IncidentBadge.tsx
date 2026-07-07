// components/incidents/IncidentBadge.tsx
import React from 'react';
import type { IncidentType } from '@/types';

interface IncidentBadgeProps {
  type: IncidentType | string;
  severity: number;
}

export const IncidentBadge: React.FC<IncidentBadgeProps> = ({ type, severity }) => {
  const getSeverityStyle = (sev: number) => {
    if (sev >= 8) {
      return {
        color: 'var(--status-crit)',
        borderColor: 'rgba(252, 129, 129, 0.3)',
        backgroundColor: 'rgba(252, 129, 129, 0.05)',
      };
    }
    if (sev >= 5) {
      return {
        color: 'var(--status-warn)',
        borderColor: 'rgba(236, 201, 75, 0.3)',
        backgroundColor: 'rgba(236, 201, 75, 0.05)',
      };
    }
    return {
      color: 'var(--status-live)',
      borderColor: 'rgba(72, 187, 120, 0.3)',
      backgroundColor: 'rgba(72, 187, 120, 0.05)',
    };
  };

  const style = getSeverityStyle(severity);

  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
      <span
        className="font-mono"
        style={{
          fontSize: '9px',
          fontWeight: 700,
          padding: '2px 6px',
          borderRadius: '3px',
          border: '1px solid',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          ...style,
        }}
      >
        SEV {severity}
      </span>
      <span
        className="font-mono"
        style={{
          fontSize: '9px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          backgroundColor: 'var(--bg-panel-alt)',
          border: '1px solid var(--border)',
          padding: '2px 6px',
          borderRadius: '3px',
          letterSpacing: '0.05em',
        }}
      >
        {type.replace('_', ' ')}
      </span>
    </div>
  );
};
export default IncidentBadge;
