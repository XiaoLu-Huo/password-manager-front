import React from 'react';
import { PasswordStrengthLevel } from '../types/api';
import { colors } from '../theme';

interface StrengthIndicatorProps {
  level: PasswordStrengthLevel;
}

const strengthConfig: Record<PasswordStrengthLevel, { color: string; label: string; segments: number }> = {
  [PasswordStrengthLevel.WEAK]: { color: colors.danger, label: '弱', segments: 1 },
  [PasswordStrengthLevel.MEDIUM]: { color: colors.warning, label: '中', segments: 2 },
  [PasswordStrengthLevel.STRONG]: { color: colors.success, label: '强', segments: 3 },
};

const StrengthIndicator: React.FC<StrengthIndicatorProps> = ({ level }) => {
  const config = strengthConfig[level];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} role="status" aria-label={`密码强度: ${config.label}`}>
      <div style={{ display: 'flex', gap: 4, flex: 1 }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: 6,
              flex: 1,
              borderRadius: 3,
              backgroundColor: i <= config.segments ? config.color : '#e5e7eb',
              transition: 'background-color 0.2s',
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: config.color, minWidth: 20 }}>
        {config.label}
      </span>
    </div>
  );
};

export default StrengthIndicator;
