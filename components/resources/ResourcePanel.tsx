// components/resources/ResourcePanel.tsx
'use client';

import React, { useState } from 'react';
import type { ResourceRecord } from '@/types';
import ResourceCard from './ResourceCard';

interface ResourcePanelProps {
  resources: ResourceRecord[];
}

export const ResourcePanel: React.FC<ResourcePanelProps> = ({ resources }) => {
  const [filterType, setFilterType] = useState<string>('ALL');

  const types = ['ALL', 'AMBULANCE', 'FIRE_TRUCK', 'RESCUE_TEAM', 'HELICOPTER', 'VOLUNTEER_GROUP'];

  const filtered = filterType === 'ALL'
    ? resources
    : resources.filter(r => r.type === filterType);

  return (
    <div className="eoc-panel" style={{ flex: 1 }}>
      <div
        className="eoc-panel-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 12px',
        }}
      >
        <span>EOC Resource Inventory</span>
        <span className="font-mono text-cyan" style={{ fontSize: '9px' }}>
          {resources.filter(r => r.status === 'AVAILABLE').length}/{resources.length} free
        </span>
      </div>

      {/* Filter tab bar */}
      <div
        style={{
          display: 'flex',
          gap: '2px',
          padding: '4px',
          borderBottom: '1px solid var(--border)',
          overflowX: 'auto',
          backgroundColor: '#0F1115',
        }}
      >
        {types.map(t => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            style={{
              padding: '2px 8px',
              backgroundColor: filterType === t ? 'var(--bg-selected)' : 'transparent',
              border: `1px solid ${filterType === t ? 'var(--accent-dim)' : 'transparent'}`,
              borderRadius: '3px',
              color: filterType === t ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: '8px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {t.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="eoc-panel-content" style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '6px' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px', fontStyle: 'italic' }}>
            No resources matching filter.
          </div>
        ) : (
          filtered.map(res => <ResourceCard key={res.id} resource={res} />)
        )}
      </div>
    </div>
  );
};
export default ResourcePanel;
