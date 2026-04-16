import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

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
  gap: 10,
  padding: '11px 16px',
  textDecoration: 'none',
  color: colors.textSecondary,
  borderRadius: 8,
  margin: '2px 8px',
  fontSize: 14,
  transition: 'background-color 0.15s, color 0.15s',
};

const activeLinkStyle: React.CSSProperties = {
  backgroundColor: colors.accentSubtle,
  color: colors.accent,
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
        backgroundColor: colors.sidebarBg,
        borderRight: `1px solid ${colors.border}`,
        padding: '16px 0',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
      aria-label="主导航"
    >
      <div style={{ padding: '8px 16px 20px', fontSize: 18, fontWeight: 700, color: colors.textPrimary, letterSpacing: 0.5 }}>
        🔐 密码管理器
      </div>

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
            gap: 10,
            width: '100%',
            padding: '11px 16px',
            border: 'none',
            borderRadius: 8,
            backgroundColor: 'transparent',
            color: colors.danger,
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
