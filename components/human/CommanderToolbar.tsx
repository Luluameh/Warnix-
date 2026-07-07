// components/human/CommanderToolbar.tsx
'use client';

import React, { useState } from 'react';

interface CommanderToolbarProps {
  runStatus: string | null;
  incidentStatus: string | null;
  checkpointMessage: string | null;
  hasCancellationRequest: boolean;
  onApprove: () => void;
  onReject: () => void;
  onOverride: (instruction: string) => void;
  onRecall: () => void;
  onResolve: () => void;
  onArchive: () => void;
  onMarkDuplicate: (parentId?: string) => void;
  onMarkFalseAlarm: () => void;
  onApproveCancellation: () => void;
  onContinueInvestigation: () => void;
}

export const CommanderToolbar: React.FC<CommanderToolbarProps> = ({
  runStatus,
  incidentStatus,
  checkpointMessage,
  hasCancellationRequest,
  onApprove,
  onReject,
  onOverride,
  onRecall,
  onResolve,
  onArchive,
  onMarkDuplicate,
  onMarkFalseAlarm,
  onApproveCancellation,
  onContinueInvestigation,
}) => {
  const [overrideInput, setOverrideInput] = useState('');
  const [showOverrideBox, setShowOverrideBox] = useState(false);
  const [showDuplicateBox, setShowDuplicateBox] = useState(false);
  const [parentIdInput, setParentIdInput] = useState('');

  const isAwaitingHuman = runStatus === 'AWAITING_HUMAN' || incidentStatus === 'AWAITING_COMMANDER';

  const handleOverrideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideInput.trim()) return;
    onOverride(overrideInput);
    setOverrideInput('');
    setShowOverrideBox(false);
  };

  const handleDuplicateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onMarkDuplicate(parentIdInput.trim() || undefined);
    setParentIdInput('');
    setShowDuplicateBox(false);
  };

  // State-based availability mapping
  // Validation checks:
  const canApproveReject = incidentStatus === 'AWAITING_COMMANDER' || runStatus === 'AWAITING_HUMAN';
  const canOverride = ['UNDER_REVIEW', 'ROUND_1_DEBATE', 'ROUND_2_DEBATE', 'AWAITING_COMMANDER', 'NEW', 'ACTIVE'].includes(incidentStatus || '');
  const canRecall = ['DISPATCHED', 'ACTIVE'].includes(incidentStatus || '');
  const canResolve = ['DISPATCHED', 'ACTIVE', 'CONTAINED', 'NEW', 'UNDER_REVIEW', 'ROUND_1_DEBATE', 'ROUND_2_DEBATE', 'AWAITING_COMMANDER'].includes(incidentStatus || '');
  const canArchive = ['RESOLVED', 'FALSE_ALARM', 'DUPLICATE', 'WITHDRAWN', 'NEW', 'UNDER_REVIEW'].includes(incidentStatus || '');
  const canMarkStatusActions = incidentStatus !== 'ARCHIVED'; // duplicate and false alarm can be set anytime except archived

  const buttonStyle = (enabled: boolean, colorBg: string, colorText = '#ffffff') => ({
    height: '24px',
    padding: '0 8px',
    backgroundColor: enabled ? colorBg : 'rgba(255, 255, 255, 0.03)',
    border: `1px solid ${enabled ? 'transparent' : 'rgba(255, 255, 255, 0.08)'}`,
    borderRadius: '3px',
    color: enabled ? colorText : 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
    fontSize: '9px',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    cursor: enabled ? 'pointer' : 'not-allowed',
    outline: 'none',
  });

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-panel)',
        border: '1px solid var(--border)',
        borderRadius: '4px',
        padding: '10px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        marginTop: 'auto',
      }}
    >
      {/* Cancellation Request Flag Alert */}
      {hasCancellationRequest && (
        <div
          style={{
            backgroundColor: 'rgba(236, 201, 75, 0.08)',
            border: '1px solid var(--status-warn)',
            borderRadius: '4px',
            padding: '8px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '4px',
          }}
        >
          <div className="status-dot warn" style={{ width: '8px', height: '8px', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="font-mono" style={{ fontSize: '9px', fontWeight: 700, color: 'var(--status-warn)' }}>
              PENDING ACTION: CITIZEN REQUESTED CANCELLATION
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-primary)', marginTop: '2px' }}>
              Confirm withdrawal of this operation or reject request to continue.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={onApproveCancellation}
              style={buttonStyle(true, 'var(--status-live)', '#000000')}
            >
              ✓ Approve Cancellation
            </button>
            <button
              onClick={onContinueInvestigation}
              style={buttonStyle(true, 'rgba(255,255,255,0.1)')}
            >
              ✕ Continue Investigation
            </button>
          </div>
        </div>
      )}

      {/* Human checkpoint alert bar */}
      {isAwaitingHuman && (
        <div
          className="pulse-ring"
          style={{
            backgroundColor: 'rgba(252, 129, 129, 0.08)',
            border: '1px solid var(--status-crit)',
            borderRadius: '4px',
            padding: '8px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div
            className="status-dot crit"
            style={{ width: '8px', height: '8px', flexShrink: 0 }}
          />
          <div style={{ flex: 1 }}>
            <div className="font-mono" style={{ fontSize: '9px', fontWeight: 700, color: 'var(--status-crit)' }}>
              CRITICAL: HUMAN INCIDENT COMMANDER DECISION REQUIRED
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-primary)', marginTop: '2px', lineHeight: '1.3' }}>
              {checkpointMessage ?? 'Review synthesized EOC plan and authorize dispatch.'}
            </p>
          </div>
        </div>
      )}

      {/* Control Buttons Grid */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
        {canApproveReject && (
          <>
            <button
              disabled={!canApproveReject}
              onClick={onApprove}
              title={!canApproveReject ? "Valid only when EOC plan is ready" : undefined}
              style={buttonStyle(canApproveReject, 'var(--status-live)', '#000000')}
            >
              ✓ Approve Dispatch
            </button>
            <button
              disabled={!canApproveReject}
              onClick={onReject}
              title={!canApproveReject ? "Valid only when EOC plan is ready" : undefined}
              style={buttonStyle(canApproveReject, 'rgba(252, 129, 129, 0.15)', 'var(--status-crit)')}
            >
              ✕ Reject Plan
            </button>
          </>
        )}

        <button
          disabled={!canRecall}
          onClick={onRecall}
          title={!canRecall ? "Requires DISPATCHED or ACTIVE status" : undefined}
          style={buttonStyle(canRecall, 'rgba(252, 129, 129, 0.15)', 'var(--status-crit)')}
        >
          Recall Resources
        </button>

        <button
          disabled={!canResolve}
          onClick={onResolve}
          title={!canResolve ? "Incident must be active or contained to resolve" : undefined}
          style={buttonStyle(canResolve, 'rgba(72, 187, 120, 0.15)', 'var(--status-live)')}
        >
          Resolve Incident
        </button>

        <button
          disabled={!canArchive}
          onClick={onArchive}
          title={!canArchive ? "Must be resolved, false alarm, or duplicate to archive" : undefined}
          style={buttonStyle(canArchive, 'var(--bg-panel-alt)')}
        >
          Archive
        </button>

        <button
          disabled={!canMarkStatusActions}
          onClick={() => setShowDuplicateBox(!showDuplicateBox)}
          style={buttonStyle(canMarkStatusActions, 'var(--bg-panel-alt)', 'var(--status-warn)')}
        >
          Duplicate
        </button>

        <button
          disabled={!canMarkStatusActions}
          onClick={onMarkFalseAlarm}
          style={buttonStyle(canMarkStatusActions, 'var(--bg-panel-alt)', 'var(--status-crit)')}
        >
          False Alarm
        </button>

        <button
          disabled={!canOverride}
          onClick={() => setShowOverrideBox(!showOverrideBox)}
          style={buttonStyle(canOverride, 'var(--bg-panel-alt)', 'var(--accent)')}
        >
          Override AI
        </button>

        <div style={{ marginLeft: 'auto', fontSize: '9px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
          Status: {incidentStatus ?? 'UNKNOWN'}
        </div>
      </div>

      {/* Override Input Box overlay panel */}
      {showOverrideBox && (
        <form onSubmit={handleOverrideSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '4px' }}>
          <label style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            Commander Override Instruction
          </label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              required
              placeholder="e.g. Redirect SAR-A to riverside bypass, ignore Sector 4 warning"
              value={overrideInput}
              onChange={e => setOverrideInput(e.target.value)}
              style={{
                flex: 1,
                height: '24px',
                backgroundColor: 'var(--bg-panel-alt)',
                border: '1px solid var(--border-active)',
                borderRadius: '3px',
                padding: '0 8px',
                color: 'var(--text-primary)',
                fontSize: '11px',
              }}
            />
            <button
              type="submit"
              style={{
                height: '24px',
                padding: '0 12px',
                backgroundColor: 'var(--accent)',
                border: 'none',
                borderRadius: '3px',
                color: '#000000',
                fontFamily: 'var(--font-mono)',
                fontSize: '9px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              RE-RUN
            </button>
          </div>
        </form>
      )}

      {/* Duplicate Parent Reference Input Box */}
      {showDuplicateBox && (
        <form onSubmit={handleDuplicateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '4px' }}>
          <label style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            Link Duplicate to Parent Incident ID (Optional)
          </label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              placeholder="e.g. clvq8zabc0000..."
              value={parentIdInput}
              onChange={e => setParentIdInput(e.target.value)}
              style={{
                flex: 1,
                height: '24px',
                backgroundColor: 'var(--bg-panel-alt)',
                border: '1px solid var(--border-active)',
                borderRadius: '3px',
                padding: '0 8px',
                color: 'var(--text-primary)',
                fontSize: '11px',
              }}
            />
            <button
              type="submit"
              style={{
                height: '24px',
                padding: '0 12px',
                backgroundColor: 'var(--status-warn)',
                border: 'none',
                borderRadius: '3px',
                color: '#000000',
                fontFamily: 'var(--font-mono)',
                fontSize: '9px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Mark Duplicate
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
export default CommanderToolbar;
