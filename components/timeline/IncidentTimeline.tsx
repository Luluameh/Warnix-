// components/timeline/IncidentTimeline.tsx
import React from 'react';
import type { TimelineEntryRecord } from '@/types';
import StatusDot from '../layout/StatusDot';

interface IncidentTimelineProps {
  timeline: TimelineEntryRecord[];
}

export const IncidentTimeline: React.FC<IncidentTimelineProps> = ({ timeline }) => {
  const getSeverityStyle = (sev: string) => {
    switch (sev) {
      case 'CRITICAL': return { color: 'var(--status-crit)', dot: 'crit' as const };
      case 'WARNING': return { color: 'var(--status-warn)', dot: 'warn' as const };
      default: return { color: 'var(--accent)', dot: 'live' as const };
    }
  };

  return (
    <div className="eoc-panel" style={{ flex: 1, minHeight: '180px' }}>
      <div className="eoc-panel-header">
        <span>Operations Log & Timeline</span>
        <span className="font-mono text-cyan" style={{ fontSize: '9px' }}>
          {timeline.length} entries
        </span>
      </div>

      <div
        className="eoc-panel-content"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '10px 12px',
          backgroundColor: '#0F1115',
        }}
      >
        {timeline.length === 0 ? (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '11px',
              fontStyle: 'italic',
            }}
          >
            No events logged for this incident yet.
          </div>
        ) : (
          timeline.map(entry => {
            const style = getSeverityStyle(entry.severity);
            return (
              <div
                key={entry.id}
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                  fontSize: '11px',
                }}
              >
                {/* Status Dot with vertical line connector */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', marginTop: '4px' }}>
                  <StatusDot status={style.dot} />
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="font-mono" style={{ fontWeight: 700, color: style.color, letterSpacing: '0.02em' }}>
                      {entry.title}
                    </span>
                    <span className="font-mono" style={{ fontSize: '8px', color: 'var(--text-muted)' }}>
                      {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-primary)', lineHeight: '1.4' }}>
                    {entry.detail}
                  </p>
                  <span className="font-mono" style={{ fontSize: '8px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '2px' }}>
                    Origin: {entry.agentId} · Category: {entry.category}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
export default IncidentTimeline;
