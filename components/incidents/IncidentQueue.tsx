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

  const [withdrawModal, setWithdrawModal] = React.useState<{ id: string; status: string } | null>(null);
  const [withdrawReason, setWithdrawReason] = React.useState('');

  const handleWithdrawClick = (e: React.MouseEvent, id: string, status: string) => {
    e.stopPropagation();
    setWithdrawReason('');
    setWithdrawModal({ id, status });
  };

  const handleWithdrawConfirm = () => {
    if (!withdrawModal) return;
    const { id, status } = withdrawModal;
    const reason = withdrawReason.trim() || (status === 'NEW' ? 'Citizen withdrew request' : 'Citizen requested cancellation');
    if (status === 'NEW') {
      if (onWithdrawReport) onWithdrawReport(id, reason);
    } else {
      if (onRequestCancellation) onRequestCancellation(id, reason);
    }
    setWithdrawModal(null);
    setWithdrawReason('');
  };

  return (
    <div className="eoc-panel" style={{ flex: 1, position: 'relative' }}>

      {/* Withdraw / Cancel Reason Modal */}
      {withdrawModal && (
        <div
          onClick={() => setWithdrawModal(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(5, 6, 8, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            backdropFilter: 'blur(3px)',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--bg-panel)',
              border: '1px solid var(--border-active)',
              borderRadius: '4px',
              padding: '20px',
              width: '90%',
              maxWidth: '320px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: 'var(--status-crit)', letterSpacing: '0.1em' }}>
              {withdrawModal.status === 'NEW' ? '⚠ WITHDRAW REPORT' : '⚠ REQUEST CANCELLATION'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {withdrawModal.status === 'NEW'
                ? 'This will immediately withdraw the report. Please state the reason.'
                : 'A cancellation request will be submitted to the Commander for review.'}
            </div>
            <textarea
              autoFocus
              value={withdrawReason}
              onChange={e => setWithdrawReason(e.target.value)}
              placeholder="Reason (optional)..."
              rows={3}
              style={{
                backgroundColor: 'var(--bg-input, #0a0f1a)',
                border: '1px solid var(--border)',
                borderRadius: '3px',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                padding: '8px',
                resize: 'none',
                outline: 'none',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setWithdrawModal(null)}
                style={{
                  padding: '4px 12px', fontSize: '10px', fontFamily: 'var(--font-mono)',
                  background: 'none', border: '1px solid var(--border)',
                  borderRadius: '3px', color: 'var(--text-secondary)', cursor: 'pointer',
                }}
              >
                CANCEL
              </button>
              <button
                onClick={handleWithdrawConfirm}
                style={{
                  padding: '4px 12px', fontSize: '10px', fontFamily: 'var(--font-mono)',
                  background: 'rgba(252,129,129,0.12)', border: '1px solid var(--status-crit)',
                  borderRadius: '3px', color: 'var(--status-crit)', cursor: 'pointer', fontWeight: 700,
                }}
              >
                CONFIRM
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="eoc-panel-header">
        <span>Incident Registry ({incidents.length})</span>
        <button
          onClick={onNewIncidentClick}
          className="btn-interactive"
          style={{
            backgroundColor: 'var(--bg-panel-alt)',
            border: '1px solid var(--accent-dim)',
            color: 'var(--accent)',
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: '3px',
            cursor: 'pointer',
            textTransform: 'uppercase',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--accent)';
            e.currentTarget.style.boxShadow = '0 0 6px rgba(0, 212, 255, 0.2)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--accent-dim)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          [+] REPORT EMERGENCY
        </button>
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

      </div>
    </div>
  );
};
export default IncidentQueue;
