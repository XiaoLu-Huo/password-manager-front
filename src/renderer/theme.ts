/**
 * Shared theme tokens — clean light design with blue accents.
 */

// ---- Colors ----
export const colors = {
  // Backgrounds
  pageBg: '#f5f7fa',
  cardBg: '#ffffff',
  inputBg: '#f8f9fb',
  sidebarBg: '#ffffff',

  // Borders
  border: '#e2e6ed',
  borderLight: '#edf0f5',
  borderFocus: '#1a73e8',

  // Text
  textPrimary: '#1f2937',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  textLink: '#1a73e8',

  // Accent
  accent: '#1a73e8',
  accentHover: '#1557b0',
  accentSubtle: '#eef4fd',

  // Status
  danger: '#dc3545',
  dangerBg: '#fef2f2',
  dangerBorder: '#dc3545',
  success: '#16a34a',
  warning: '#f59e0b',

  // Tags
  tagBg: '#eef4fd',
  tagText: '#1a73e8',

  // Overlay
  overlay: 'rgba(0,0,0,0.4)',
};

// ---- Shared styles ----
export const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  fontSize: 14,
  color: colors.textPrimary,
  backgroundColor: colors.inputBg,
  border: `1px solid ${colors.border}`,
  borderRadius: 8,
  outline: 'none',
  boxSizing: 'border-box',
};

export const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  color: colors.textSecondary,
  marginBottom: 6,
  fontWeight: 500,
};

export const cardStyle: React.CSSProperties = {
  backgroundColor: colors.cardBg,
  borderRadius: 12,
  padding: 24,
  border: `1px solid ${colors.border}`,
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
};

export const primaryBtnStyle: React.CSSProperties = {
  padding: '10px 18px',
  fontSize: 14,
  fontWeight: 600,
  color: '#fff',
  backgroundColor: colors.accent,
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
};

export const secondaryBtnStyle: React.CSSProperties = {
  padding: '10px 18px',
  fontSize: 14,
  fontWeight: 500,
  color: colors.accent,
  backgroundColor: 'transparent',
  border: `1px solid ${colors.border}`,
  borderRadius: 8,
  cursor: 'pointer',
};

export const dangerBtnStyle: React.CSSProperties = {
  padding: '10px 18px',
  fontSize: 14,
  fontWeight: 500,
  color: colors.danger,
  backgroundColor: 'transparent',
  border: `1px solid ${colors.dangerBorder}`,
  borderRadius: 8,
  cursor: 'pointer',
};

export const linkBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: colors.textLink,
  fontSize: 14,
  cursor: 'pointer',
  padding: 0,
};

export const errorStyle: React.CSSProperties = {
  color: colors.danger,
  fontSize: 12,
  margin: '4px 0 0',
};
