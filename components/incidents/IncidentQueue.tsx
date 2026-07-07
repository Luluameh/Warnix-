// components/incidents/IncidentQueue.tsx
'use client';

import React from 'react';
import type { IncidentRecord } from '@/types';
import IncidentBadge from './IncidentBadge';
import StatusDot from '../layout/StatusDot';

interface IncidentQueueProps {
  incidents: IncidentRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNewIncidentClick: () => void;
  onWithdrawReport?: (id: string, reason: string) => void;
  onRequestCancellation?: (id: string, reason: string) => void;
}

export const IncidentQueue: React.FC<IncidentQueueProps> = ({
  incidents,
  selectedId,
  onSelect,
  onNewIncidentClick,
  onWithdrawReport,
  onRequestCancellation,
}) => {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'NEW': return 'warn';
      case 'UNDER_REVIEW': return 'warn';
      case 'ROUND_1_DEBATE': return 'warn';
      case 'ROUND_2_DEBATE': return 'warn';
      case 'AWAITING_COMMANDER': return 'crit';
      case 'DISPATCHED': return 'live';
      case 'ACTIVE': return 'crit';
      case 'CONTAINED': return 'warn';
      case 'RESOLVED': return 'live';
      case 'FALSE_ALARM': return 'idle';
      case 'DUPLICATE': return 'idle';
      case 'WITHDRAWN': return 'idle';
      case 'ARCHIVED': return 'idle';
      default: return 'idle';
    }
  };

  const handleWithdrawClick = (e: React.MouseEvent, id: string, status: string) => {
    e.stopPropagation();
    const reason = prompt('Please state the reason for withdrawal / cancellation:');
    if (reason === null) return; // user cancelled prompt
    
    if (status === 'NEW') {
      if (onWithdrawReport) onWithdrawReport(id, reason || 'Citizen withdrew request');
    } else {
      if (onRequestCancellation) onRequestCancellation(id, reason || 'Citizen requested cancellation');
    }
  };

  return (
    <div className="eoc-panel" style={{ flex: 1 }}>
      <div className="eoc-panel-header">
        <span>Incident Registry</span>
        <span className="font-mono text-cyan" style={{ fontSize: '9px' }}>
          {incidents.length} logged
        </span>
      </div>

      <div className="eoc-panel-content" style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '6px' }}>
        {incidents.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              fontSize: '11px',
              height: '120px',
              border: '1px dashed var(--border)',
              borderRadius: '4px',
            }}
          >
            No incidents reported.
          </div>
        ) : (
          incidents.map(inc => {
            const isSelected = inc.id === selectedId;
            const isNew = inc.status === 'NEW';
            const isWithdrawnOrArchived = ['WITHDRAWN', 'ARCHIVED', 'FALSE_ALARM', 'DUPLICATE', 'RESOLVED'].includes(inc.status);
            const canCancelOrWithdraw = !isWithdrawnOrArchived;

            return (
              <div
                key={inc.id}
                onClick={() => onSelect(inc.id)}
                style={{
                  backgroundColor: isSelected ? 'var(--bg-selected)' : 'var(--bg-panel)',
                  border: `1px solid ${isSelected ? 'var(--accent-dim)' : 'var(--border)'}`,
                  borderRadius: '4px',
                  padding: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                    <span className="font-mono" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                      {inc.title}
                    </span>
                    <span className="font-mono" style={{ fontSize: '8px', color: 'var(--text-secondary)' }}>
                      STATUS: {inc.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <StatusDot status={getStatusStyle(inc.status)} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                  <IncidentBadge type={inc.type} severity={inc.severity} />
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {canCancelOrWithdraw && (
                      <button
                        onClick={(e) => handleWithdrawClick(e, inc.id, inc.status)}
                        style={{
                          background: 'none',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: 'var(--text-secondary)',
                          fontSize: '8px',
                          padding: '2px 4px',
                          borderRadius: '2px',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-mono)',
                          textTransform: 'uppercase',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = 'var(--status-crit)';
                          e.currentTarget.style.color = 'var(--status-crit)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                          e.currentTarget.style.color = 'var(--text-secondary)';
                        }}
                      >
                        {isNew ? 'Withdraw' : 'Cancel'}
                      </button>
                    )}
                    <span className="font-mono" style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                      {new Date(inc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}

        <button
          onClick={onNewIncidentClick}
          style={{
            marginTop: '8px',
            height: '28px',
            backgroundColor: 'var(--bg-panel-alt)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            color: 'var(--accent)',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            fontWeight: 700,
            textTransform: 'uppercase',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
            e.currentTarget.style.borderColor = 'var(--accent-dim)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = 'var(--bg-panel-alt)';
            e.currentTarget.style.borderColor = 'var(--border)';
          }}
        >
          [+] REPORT EMERGENCY
        </button>
      </div>
    </div>
  );
};
export default IncidentQueue;
