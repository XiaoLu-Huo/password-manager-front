import React from 'react';
import { Outlet } from 'react-router-dom';

/**
 * Main application layout: sidebar navigation + content area.
 * The Sidebar component will be implemented in a separate task (2.4).
 * For now, we render a placeholder nav and the routed content via <Outlet />.
 */
const AppLayout: React.FC = () => {
  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar placeholder – will be replaced by <Sidebar /> in task 2.4 */}
      <nav
        style={{
          width: 220,
          flexShrink: 0,
          borderRight: '1px solid #e0e0e0',
          padding: '16px 0',
          boxSizing: 'border-box',
        }}
        aria-label="主导航"
      />
      <main style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
