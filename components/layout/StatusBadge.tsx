// components/layout/StatusBadge.tsx
import React from 'react';

export type StatusType = 'ONLINE' | 'CONNECTING' | 'OFFLINE' | 'WARNING' | 'ACTIVE' | 'IDLE';

interface StatusBadgeProps {
  label: string;
  status: StatusType;
  pulse?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ label, status, pulse = true }) => {
  const getStatusColorClass = () => {
    switch (status) {
      case 'ONLINE':
      case 'ACTIVE':
        return 'status-indicator-glow-green';
      case 'CONNECTING':
      case 'WARNING':
        return 'status-indicator-glow-yellow';
      case 'OFFLINE':
        return 'status-indicator-glow-red';
      default:
        return '';
    }
  };

  const getStatusTextColor = () => {
    switch (status) {
      case 'ONLINE':
      case 'ACTIVE':
        return 'var(--status-live)';
      case 'CONNECTING':
      case 'WARNING':
        return 'var(--status-warn)';
      case 'OFFLINE':
        return 'var(--status-crit)';
      default:
        return 'var(--text-secondary)';
    }
  };

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: 'var(--bg-panel-alt)',
        border: '1px solid var(--border)',
        borderRadius: '3px',
        padding: '3px 8px',
        userSelect: 'none',
      }}
    >
      <span
        className={pulse ? getStatusColorClass() : ''}
        style={{
          width: '5px',
          height: '5px',
          borderRadius: '50%',
          backgroundColor: pulse ? undefined : getStatusTextColor(),
          display: 'inline-block',
        }}
      />
      <span
        className="font-mono"
        style={{
          fontSize: '9px',
          fontWeight: 700,
          color: getStatusTextColor(),
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </span>
    </div>
  );
};
export default StatusBadge;
