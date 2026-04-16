import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { colors } from '../theme';

const AppLayout: React.FC = () => {
  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: colors.pageBg }}>
      <Sidebar />
      <main style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
