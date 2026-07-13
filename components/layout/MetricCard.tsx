// components/layout/MetricCard.tsx
import React from 'react';
import AnimatedCounter from './AnimatedCounter';

interface MetricCardProps {
  label: string;
  value: number | string;
  subtitle?: string;
  glow?: boolean;
  animate?: boolean;
  style?: React.CSSProperties;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtitle,
  glow = false,
  animate = false,
  style,
}) => {
  return (
    <div
      className="hover-lift-cyan"
      style={{
        backgroundColor: 'var(--bg-panel-alt)',
        border: '1px solid var(--border)',
        borderRadius: '4px',
        padding: '10px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        minWidth: '100px',
        userSelect: 'none',
        ...style,
      }}
    >
      <span
        style={{
          fontSize: '9px',
          textTransform: 'uppercase',
          color: 'var(--text-secondary)',
          letterSpacing: '0.08em',
          fontWeight: 500,
        }}
      >
        {label}
      </span>
      <span
        className={`font-mono ${glow ? 'text-cyan glow-cyan' : ''}`}
        style={{
          fontSize: '18px',
          fontWeight: 700,
          color: glow ? undefined : 'var(--text-primary)',
          lineHeight: '1.2',
        }}
      >
        {animate && typeof value === 'number' ? (
          <AnimatedCounter value={value} />
        ) : (
          value
        )}
      </span>
      {subtitle && (
        <span
          style={{
            fontSize: '8px',
            color: 'var(--text-muted)',
            letterSpacing: '0.02em',
          }}
        >
          {subtitle}
        </span>
      )}
    </div>
  );
};
export default MetricCard;
