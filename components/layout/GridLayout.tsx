// components/layout/GridLayout.tsx
import React from 'react';

interface GridLayoutProps {
  children: React.ReactNode;
}

export const GridLayout: React.FC<GridLayoutProps> = ({ children }) => {
  return (
    <div className="eoc-layout">
      {children}
    </div>
  );
};

interface GridBodyProps {
  children: React.ReactNode;
}

export const GridBody: React.FC<GridBodyProps> = ({ children }) => {
  return (
    <div className="eoc-grid-body">
      {children}
    </div>
  );
};
export default GridLayout;
