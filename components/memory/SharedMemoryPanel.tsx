// components/memory/SharedMemoryPanel.tsx
'use client';

import React, { useState } from 'react';
import { AgentId, AGENT_META } from '@/types';

interface SharedFact {
  id: string;
  claim: string;
  addedBy: AgentId;
  confirmedBy: AgentId[];
  challengedBy: AgentId[];
  evidenceTier: 1 | 2 | 3;
  status: 'CONFIRMED' | 'DISPUTED' | 'RETRACTED';
}

interface SharedRoute {
  id: string;
  name: string;
  status: 'CLEAR' | 'BLOCKED' | 'UNCERTAIN';
  blockedBy?: AgentId;
  blockedReason?: string;
}

interface SharedMemoryPanelProps {
  facts: SharedFact[];
  routes: SharedRoute[];
  shortages: Array<{ type: string; deficit: number; affected: string[]; mitigation: string }>;
}

export const SharedMemoryPanel: React.FC<SharedMemoryPanelProps> = ({
  facts,
  routes,
  shortages,
}) => {
  const [activeTab, setActiveTab] = useState<'FACTS' | 'ROUTES' | 'SHORTAGES'>('FACTS');

  const confirmed = facts.filter(f => f.status === 'CONFIRMED');
  const disputed = facts.filter(f => f.status === 'DISPUTED');

  const getAgentName = (id: AgentId) => {
    return AGENT_META[id]?.name ?? id;
  };

  return (
    <div className="eoc-panel" style={{ flex: 1 }}>
      <div
        className="eoc-panel-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0',
        }}
      >
        <div style={{ display: 'flex', height: '100%' }}>
          {(['FACTS', 'ROUTES', 'SHORTAGES'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'none',
                border: 'none',
                borderRight: '1px solid var(--border)',
                height: '100%',
                padding: '0 12px',
                color: activeTab === tab ? 'var(--accent)' : 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '9px',
                fontWeight: 700,
                cursor: 'pointer',
                backgroundColor: activeTab === tab ? 'var(--bg-panel)' : 'transparent',
                outline: 'none',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
        <span className="font-mono text-cyan" style={{ fontSize: '9px', paddingRight: '12px' }}>
          COLLABORATIVE BLACKBOARD
        </span>
      </div>

      <div className="eoc-panel-content" style={{ padding: '6px' }}>
        {/* Tab 1: Facts */}
        {activeTab === 'FACTS' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Confirmed facts */}
            <div>
              <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--status-live)', fontWeight: 700, marginBottom: '4px' }}>
                Confirmed Facts ({confirmed.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {confirmed.length === 0 ? (
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No confirmed facts.</div>
                ) : (
                  confirmed.map(fact => (
                    <div
                      key={fact.id}
                      style={{
                        backgroundColor: 'var(--bg-panel-alt)',
                        border: '1px solid var(--border)',
                        borderRadius: '3px',
                        padding: '6px 8px',
                        fontSize: '11px',
                      }}
                    >
                      <div style={{ color: 'var(--text-primary)', lineHeight: '1.3' }}>
                        {fact.claim}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        <span>Sourced by: {getAgentName(fact.addedBy)} (T{fact.evidenceTier})</span>
                        <span>Confirmed: {fact.confirmedBy.map(getAgentName).join(', ')}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Disputed facts */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
              <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--status-crit)', fontWeight: 700, marginBottom: '4px' }}>
                Disputed Claims ({disputed.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {disputed.length === 0 ? (
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No disputed claims.</div>
                ) : (
                  disputed.map(fact => (
                    <div
                      key={fact.id}
                      style={{
                        backgroundColor: 'var(--bg-panel-alt)',
                        border: '1px solid rgba(252, 129, 129, 0.2)',
                        borderRadius: '3px',
                        padding: '6px 8px',
                        fontSize: '11px',
                      }}
                    >
                      <div style={{ color: 'var(--text-primary)', lineHeight: '1.3' }}>
                        {fact.claim}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        <span>Source: {getAgentName(fact.addedBy)}</span>
                        <span style={{ color: 'var(--status-crit)' }}>Challenged: {fact.challengedBy.map(getAgentName).join(', ')}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Routes */}
        {activeTab === 'ROUTES' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {routes.length === 0 ? (
              <div
                style={{
                  padding: '16px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '11px',
                  fontStyle: 'italic',
                }}
              >
                No route restrictions logged.
              </div>
            ) : (
              routes.map(route => {
                const isBlocked = route.status === 'BLOCKED';
                return (
                  <div
                    key={route.id}
                    style={{
                      backgroundColor: 'var(--bg-panel-alt)',
                      border: `1px solid ${isBlocked ? 'rgba(252, 129, 129, 0.2)' : 'var(--border)'}`,
                      borderRadius: '3px',
                      padding: '6px 8px',
                      fontSize: '11px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div className="font-mono" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {route.name}
                      </div>
                      {route.blockedReason && (
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          Reason: {route.blockedReason}
                        </div>
                      )}
                    </div>
                    <span
                      className="font-mono"
                      style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        color: isBlocked ? 'var(--status-crit)' : route.status === 'UNCERTAIN' ? 'var(--status-warn)' : 'var(--status-live)',
                      }}
                    >
                      {route.status}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 3: Shortages */}
        {activeTab === 'SHORTAGES' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {shortages.length === 0 ? (
              <div
                style={{
                  padding: '16px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '11px',
                  fontStyle: 'italic',
                }}
              >
                No resource shortages detected by AEGIS.
              </div>
            ) : (
              shortages.map((sh, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: 'var(--bg-panel-alt)',
                    border: '1px solid rgba(252, 129, 129, 0.2)',
                    borderRadius: '3px',
                    padding: '6px 8px',
                    fontSize: '11px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                    <span style={{ color: 'var(--status-crit)' }}>{sh.type} SHORTAGE</span>
                    <span className="font-mono" style={{ color: 'var(--text-primary)' }}>Deficit: -{sh.deficit}</span>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Affected sectors: {sh.affected.join(', ')}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--status-live)', marginTop: '4px' }}>
                    Mitigation: {sh.mitigation}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
export default SharedMemoryPanel;
