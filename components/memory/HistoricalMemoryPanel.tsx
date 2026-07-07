// components/memory/HistoricalMemoryPanel.tsx
'use client';

import React from 'react';
import type { HistoricalIncidentRecord } from '@/types';

interface HistoricalMatch {
  title: string;
  year: number;
  location: string;
  similarity_score: number;
  summary: string;
  lessons_learned: string[];
}

interface HistoricalMemoryPanelProps {
  matches: HistoricalMatch[];
}

export const HistoricalMemoryPanel: React.FC<HistoricalMemoryPanelProps> = ({ matches }) => {
  return (
    <div className="eoc-panel" style={{ flex: 1 }}>
      <div className="eoc-panel-header">
        <span>ARCHIVE Precedents Log</span>
        <span className="font-mono text-cyan" style={{ fontSize: '9px' }}>
          {matches.length} matches
        </span>
      </div>

      <div className="eoc-panel-content" style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '6px' }}>
        {matches.length === 0 ? (
          <div
            style={{
              padding: '16px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '11px',
              border: '1px dashed var(--border)',
              borderRadius: '4px',
            }}
          >
            No historical precedents matching threshold (≥50%).
          </div>
        ) : (
          matches.map((match, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: 'var(--bg-panel-alt)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                padding: '8px 10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="font-mono" style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {match.title} ({match.year})
                </span>
                <span
                  className="font-mono text-cyan glow-cyan"
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                  }}
                >
                  {Math.round(match.similarity_score * 100)}% Match
                </span>
              </div>

              <p style={{ fontSize: '10px', color: 'var(--text-secondary)', lineHeight: '1.3' }}>
                {match.summary}
              </p>

              {match.lessons_learned && match.lessons_learned.length > 0 && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '4px', marginTop: '2px' }}>
                  <span className="font-mono" style={{ fontSize: '8px', textTransform: 'uppercase', color: 'var(--status-warn)' }}>
                    Key Lesson Learned:
                  </span>
                  <p style={{ fontSize: '10px', color: 'var(--text-primary)', marginTop: '1px', fontStyle: 'italic' }}>
                    &quot;{match.lessons_learned[0]}&quot;
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
export default HistoricalMemoryPanel;
