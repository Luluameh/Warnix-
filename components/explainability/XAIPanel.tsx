// components/explainability/XAIPanel.tsx
'use client';

import React from 'react';
import type { CoordinatorDecision } from '@/types';

interface XAIPanelProps {
  decision: CoordinatorDecision | null;
}

export const XAIPanel: React.FC<XAIPanelProps> = ({ decision }) => {
  if (!decision) {
    return (
      <div className="eoc-panel" style={{ flex: 1 }}>
        <div className="eoc-panel-header">
          <span>Explainable AI (XAI) Engine</span>
        </div>
        <div className="eoc-panel-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
          No synthesized EOC decision plan available.
        </div>
      </div>
    );
  }

  const getVoteColor = (v: string) => {
    switch (v) {
      case 'AGREE': return 'var(--status-live)';
      case 'PARTIAL': return 'var(--status-warn)';
      case 'DISAGREE': return 'var(--status-crit)';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div className="eoc-panel" style={{ flex: 1 }}>
      <div className="eoc-panel-header">
        <span>XAI Coordinator Breakdown</span>
        <span className="font-mono text-cyan" style={{ fontSize: '9px' }}>
          Decision metrics
        </span>
      </div>

      <div className="eoc-panel-content" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Core gauges */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div style={{ backgroundColor: 'var(--bg-panel-alt)', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '8px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
              Synthesized Confidence
            </span>
            <div className="font-mono text-cyan glow-cyan" style={{ fontSize: '18px', fontWeight: 700, marginTop: '2px' }}>
              {Math.round(decision.overallConfidence * 100)}%
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-panel-alt)', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '8px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
              Urgency Matrix
            </span>
            <div className="font-mono" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--status-warn)', marginTop: '2px' }}>
              {Math.round(decision.overallUrgency * 100)}%
            </div>
          </div>
        </div>

        {/* Narrative description */}
        <div style={{ backgroundColor: 'var(--bg-panel-alt)', border: '1px solid var(--border)', borderRadius: '4px', padding: '10px' }}>
          <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '4px' }}>
            Decision Narrative (Plain English)
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-primary)', lineHeight: '1.4' }}>
            {decision.decisionNarrative}
          </p>
        </div>

        {/* Consensus checklist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700 }}>
            Society Consensus
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {decision.agentConsensus.map((c, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: 'var(--bg-panel-alt)',
                  border: '1px solid var(--border)',
                  borderRadius: '3px',
                  padding: '6px 8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="font-mono" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    {c.agentId}
                  </span>
                  <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>
                    ({Math.round(c.confidence * 100)}%)
                  </span>
                </div>
                <span
                  className="font-mono"
                  style={{
                    fontWeight: 700,
                    color: getVoteColor(c.vote),
                  }}
                >
                  {c.vote}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Conflicts resolved */}
        {decision.conflictsResolved.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
            <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--status-warn)', fontWeight: 700 }}>
              Resolved Disagreements
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {decision.conflictsResolved.map((res, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: 'var(--bg-panel-alt)',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    padding: '8px',
                    fontSize: '11px',
                  }}
                >
                  <div className="font-mono" style={{ fontSize: '9px', color: 'var(--status-warn)', fontWeight: 700 }}>
                    {res.between[0]} ↔ {res.between[1]} : &quot;{res.conflict}&quot;
                  </div>
                  <div style={{ marginTop: '4px', color: 'var(--status-live)' }}>
                    <span style={{ fontWeight: 600 }}>Nexus Ruling:</span> {res.resolution}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default XAIPanel;
