// components/agents/AgentDebateChat.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import type { AgentMessageRecord } from '@/types';
import DebateMessage from './DebateMessage';

interface AgentDebateChatProps {
  messages: AgentMessageRecord[];
}

export const AgentDebateChat: React.FC<AgentDebateChatProps> = ({ messages }) => {
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="eoc-panel" style={{ flex: 1, minHeight: '180px' }}>
      <div className="eoc-panel-header">
        <span>EOC Deliberation Chat Stream</span>
        <span className="font-mono text-cyan" style={{ fontSize: '9px' }}>
          LIVE FEED
        </span>
      </div>

      <div
        className="eoc-panel-content"
        style={{
          padding: '0',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0F1115',
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '11px',
              fontStyle: 'italic',
            }}
          >
            Awaiting EOC incident transmission to begin live debate...
          </div>
        ) : (
          messages.map(msg => <DebateMessage key={msg.id} message={msg} />)
        )}
        <div ref={chatEndRef} />
      </div>
    </div>
  );
};
export default AgentDebateChat;
