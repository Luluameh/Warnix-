// components/layout/GridLayout.tsx
import React from 'react';

interface GridLayoutProps {
  children: React.ReactNode;
}

export const GridLayout: React.FC<GridLayoutProps> = ({ children }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        backgroundColor: 'var(--bg-base)',
        color: 'var(--text-primary)',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
};

interface GridBodyProps {
  children: React.ReactNode;
}

export const GridBody: React.FC<GridBodyProps> = ({ children }) => {
  return (
    <div
      style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '320px 1fr 360px',
        gridTemplateRows: '1fr 220px',
        overflow: 'hidden',
        gap: '4px',
        padding: '4px',
        backgroundColor: 'var(--bg-base)',
      }}
    >
      {children}
    </div>
  );
};
export default GridLayout;
