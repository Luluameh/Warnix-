// components/layout/TopBar.tsx
'use client';

import React, { useEffect, useState } from 'react';
import StatusDot from './StatusDot';
import Link from 'next/link';

interface TopBarProps {
  activeCount: number;
  totalCount: number;
  sseStatus: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING';
}

export const TopBar: React.FC<TopBarProps> = ({ activeCount, totalCount, sseStatus }) => {
  const [time, setTime] = useState<string>('00:00:00 UTC');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hrs = String(now.getUTCHours()).padStart(2, '0');
      const mins = String(now.getUTCMinutes()).padStart(2, '0');
      const secs = String(now.getUTCSeconds()).padStart(2, '0');
      setTime(`${hrs}:${mins}:${secs} UTC`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const sseStatusDotMap = {
    CONNECTED: 'live' as const,
    CONNECTING: 'warn' as const,
    DISCONNECTED: 'crit' as const,
  };

  return (
    <header
      style={{
        height: '48px',
        backgroundColor: 'var(--bg-panel)',
        borderBottom: '1px solid var(--border)',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        userSelect: 'none',
        zIndex: 10,
      }}
    >
      {/* Brand info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img
            src="/logo.png"
            alt="Warnix Logo"
            style={{
              width: '20px',
              height: '20px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 0 4px var(--accent-dim))',
            }}
          />
          <h1
            className="font-mono text-cyan glow-cyan"
            style={{
              fontSize: '14px',
              fontWeight: 700,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              margin: 0,
            }}
          >
            WARNIX EOC
          </h1>
        </Link>
        <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--border)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <StatusDot status={sseStatusDotMap[sseStatus]} />
          <span
            className="font-mono"
            style={{
              fontSize: '10px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              letterSpacing: '0.05em',
            }}
          >
            {sseStatus}
          </span>
        </div>
      </div>

      {/* Counters & stats */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
              Active Incidents
            </span>
            <span className="font-mono text-cyan" style={{ fontSize: '14px', fontWeight: 700 }}>
              {activeCount}
            </span>
          </div>
          <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
              Total Operations
            </span>
            <span className="font-mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {totalCount}
            </span>
          </div>
        </div>
      </div>

      {/* UTC Clock */}
      <div
        className="font-mono text-cyan glow-cyan"
        style={{
          fontSize: '14px',
          fontWeight: 700,
          letterSpacing: '0.05em',
          backgroundColor: 'var(--bg-panel-alt)',
          padding: '4px 10px',
          border: '1px solid var(--border)',
          borderRadius: '4px',
        }}
      >
        {time}
      </div>
    </header>
  );
};
export default TopBar;
