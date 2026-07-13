// components/layout/TopBar.tsx
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import StatusBadge, { StatusType } from './StatusBadge';
import AnimatedCounter from './AnimatedCounter';
import Link from 'next/link';

interface TopBarProps {
  activeCount: number;
  totalCount: number;
  sseStatus: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING';
  availableResources: number;
  deployedResources: number;
  returningResources: number;
  agentConsensus: number;
  avgResponseTime: string;
  reasoningStage: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeCount,
  totalCount,
  sseStatus,
  availableResources,
  deployedResources,
  returningResources,
  agentConsensus,
  avgResponseTime,
  reasoningStage,
}) => {
  // Live UTC Clock
  const [time, setTime] = useState<string>('00:00:00 UTC');
  // Mission Uptime Timer
  const [uptimeSecs, setUptimeSecs] = useState<number>(0);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hrs = String(now.getUTCHours()).padStart(2, '0');
      const mins = String(now.getUTCMinutes()).padStart(2, '0');
      const secs = String(now.getUTCSeconds()).padStart(2, '0');
      setTime(`${hrs}:${mins}:${secs} UTC`);
    };

    updateTime();
    const clockInterval = setInterval(updateTime, 1000);
    const uptimeInterval = setInterval(() => {
      setUptimeSecs(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(clockInterval);
      clearInterval(uptimeInterval);
    };
  }, []);

  const formatUptime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hrs).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
  };

  const getSseBadgeStatus = (): StatusType => {
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

  // Memoize reasoning stage style mapping
  const getReasoningStageStyle = useMemo(() => {
    switch (reasoningStage) {
      case 'MONITORING':
      case 'IDLE':
        return { color: 'var(--text-secondary)', border: '1px solid var(--border)' };
      case 'UNDER REVIEW':
      case 'ROUND 1 DELIBERATION':
      case 'ROUND 2 NEGOTIATION':
        return { color: 'var(--status-warn)', border: '1px solid var(--status-warn)', animation: 'pulse-glow-yellow 2s infinite ease-in-out' };
      case 'AWAITING COMMANDER':
        return { color: 'var(--status-crit)', border: '1px solid var(--status-crit)', animation: 'pulse-glow-crit 1s infinite ease-in-out' };
      case 'DISPATCHING':
      case 'ACTIVE RESPONSE':
        return { color: 'var(--accent)', border: '1px solid var(--accent)', animation: 'pulse-glow-cyan 2s infinite ease-in-out' };
      case 'RESOLVED':
        return { color: 'var(--status-live)', border: '1px solid var(--status-live)' };
      default:
        return { color: 'var(--text-primary)', border: '1px solid var(--border)' };
    }
  }, [reasoningStage]);

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
        boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
      }}
    >
      {/* 1. Left Section: Title & Mission Uptime */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              margin: 0,
              lineHeight: 1,
            }}
          >
            WARNIX EOC
          </h1>
        </Link>
        <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--border)' }} />
        
        {/* Mission Uptime Timer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '8px', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
            UPTIME:
          </span>
          <span className="font-mono" style={{ fontSize: '10px', fontWeight: 700, color: 'var(--status-live)' }}>
            {formatUptime(uptimeSecs)}
          </span>
        </div>
      </div>

      {/* 2. Middle Section: Critical EOC Telemetry */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Active Incidents */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(0,0,0,0.2)', padding: '2px 8px', borderRadius: '3px', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: '8px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>ACTIVE:</span>
          <span className="font-mono text-cyan" style={{ fontSize: '11px', fontWeight: 700 }}>
            <AnimatedCounter value={activeCount} />
          </span>
        </div>

        {/* Available Resources */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(0,0,0,0.2)', padding: '2px 8px', borderRadius: '3px', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: '8px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>AVAIL RESOURCES:</span>
          <span className="font-mono" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--status-live)' }}>
            <AnimatedCounter value={availableResources} />
          </span>
        </div>

        {/* AI Stage */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(0,0,0,0.2)', padding: '2px 8px', borderRadius: '3px', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: '8px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>AI STAGE:</span>
          <div
            className="font-mono"
            style={{
              fontSize: '8px',
              fontWeight: 700,
              padding: '1px 4px',
              borderRadius: '2px',
              backgroundColor: 'rgba(0,0,0,0.4)',
              textTransform: 'uppercase',
              ...getReasoningStageStyle,
            }}
          >
            {reasoningStage}
          </div>
        </div>
      </div>

      {/* 3. Right Section: UTC Clock only */}
      <div
        className="font-mono text-cyan glow-cyan"
        style={{
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.05em',
          backgroundColor: 'var(--bg-panel-alt)',
          padding: '2px 8px',
          border: '1px solid var(--border)',
          borderRadius: '3px',
        }}
      >
        {time}
      </div>
    </header>
  );
};
export default TopBar;
