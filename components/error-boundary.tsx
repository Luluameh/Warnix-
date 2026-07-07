// components/error-boundary.tsx
'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('EOC Panel Error Caught:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div
            style={{
              padding: '16px',
              backgroundColor: 'var(--bg-panel)',
              border: '1px solid var(--status-crit)',
              borderRadius: '4px',
              color: 'var(--status-crit)',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              height: '100%',
            }}
          >
            <div>[!] PANEL TELEMETRY LOST</div>
            <button
              onClick={() => this.setState({ hasError: false })}
              style={{
                marginTop: '6px',
                padding: '2px 8px',
                backgroundColor: 'rgba(252, 129, 129, 0.1)',
                border: '1px solid var(--status-crit)',
                borderRadius: '3px',
                color: 'var(--status-crit)',
                fontSize: '9px',
                cursor: 'pointer',
              }}
            >
              Attempt Reconnection
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
