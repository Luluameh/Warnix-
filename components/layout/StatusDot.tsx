// components/layout/StatusDot.tsx
import React from 'react';

interface StatusDotProps {
  status: 'live' | 'warn' | 'crit' | 'idle';
  className?: string;
}

export const StatusDot: React.FC<StatusDotProps> = ({ status, className = '' }) => {
  return <span className={`status-dot ${status} ${className}`} />;
};
export default StatusDot;
