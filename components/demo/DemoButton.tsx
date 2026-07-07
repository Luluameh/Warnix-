// components/demo/DemoButton.tsx
'use client';

import React, { useState } from 'react';

interface DemoButtonProps {
  demoRunId: string;
  onDemoStarted: (incidentId: string, runId: string) => void;
}

export const DemoButton: React.FC<DemoButtonProps> = ({ demoRunId, onDemoStarted }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleStartDemo = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setStatusMessage('Initializing simulation context...');
    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId: demoRunId }),
      });
      if (!res.ok) throw new Error('Demo server failed to start');
      const data = await res.json();
      
      setStatusMessage('Demo triggered successfully. Spawning emergencies...');
      setTimeout(() => setStatusMessage(null), 6000);
      
      // Auto-select first incident and run
      if (data.firstIncidentId && data.firstRunId) {
        onDemoStarted(data.firstIncidentId, data.firstRunId);
      }
    } catch (err) {
      console.error(err);
      setStatusMessage('Failed to initialize demo.');
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <button
        onClick={handleStartDemo}
        disabled={isRunning}
        style={{
          height: '28px',
          padding: '0 16px',
          backgroundColor: isRunning ? 'var(--bg-panel-alt)' : 'rgba(0, 212, 255, 0.1)',
          border: `1px solid ${isRunning ? 'var(--border)' : 'var(--accent)'}`,
          borderRadius: '4px',
          color: isRunning ? 'var(--text-secondary)' : 'var(--accent)',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          fontWeight: 700,
          textTransform: 'uppercase',
          cursor: isRunning ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'all 0.15s ease',
        }}
      >
        <span>⚡ {isRunning ? 'SIMULATION ACTIVE' : 'ONE-CLICK DEMO'}</span>
      </button>
      {statusMessage && (
        <span
          className="font-mono text-cyan glow-cyan"
          style={{
            fontSize: '9px',
            textAlign: 'center',
            marginTop: '2px',
          }}
        >
          {statusMessage}
        </span>
      )}
    </div>
  );
};
export default DemoButton;
