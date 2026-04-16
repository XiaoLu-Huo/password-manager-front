import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface NavItem {
  to: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { to: '/vault', label: '密码库', icon: '🔑' },
  { to: '/generator', label: '密码生成器', icon: '⚙️' },
  { to: '/security-report', label: '安全报告', icon: '🛡️' },
  { to: '/import-export', label: '导入导出', icon: '📦' },
  { to: '/settings', label: '设置', icon: '⚡' },
];

const linkStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 16px',
  textDecoration: 'none',
  color: '#333',
  borderRadius: 6,
  margin: '2px 8px',
  fontSize: 14,
  transition: 'background-color 0.15s',
};

const activeLinkStyle: React.CSSProperties = {
  backgroundColor: '#e8f0fe',
  color: '#1a73e8',
  fontWeight: 600,
};

const Sidebar: React.FC = () => {
  const { lock } = useAuth();
  const navigate = useNavigate();

  const handleLock = () => {
    lock();
    navigate('/unlock');
  };

  return (
    <nav
      style={{
        width: 220,
        flexShrink: 0,
        borderRight: '1px solid #e0e0e0',
        padding: '16px 0',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
      aria-label="主导航"
    >
      <div style={{ flex: 1 }}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              ...linkStyle,
              ...(isActive ? activeLinkStyle : {}),
            })}
          >
            <span aria-hidden="true">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </div>

      <div style={{ padding: '0 8px' }}>
        <button
          onClick={handleLock}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: '100%',
            padding: '10px 16px',
            border: 'none',
            borderRadius: 6,
            backgroundColor: 'transparent',
            color: '#d93025',
            fontSize: 14,
            cursor: 'pointer',
            textAlign: 'left',
          }}
          type="button"
        >
          <span aria-hidden="true">🔒</span>
          锁定密码库
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;
