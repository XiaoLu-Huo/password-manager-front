import React, { useState } from 'react';
import { colors } from '../theme';

interface CopyableTextProps {
  text: string;
}

const CopyableText: React.FC<CopyableTextProps> = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (window.electronBridge?.clipboard) {
        await window.electronBridge.clipboard.copyPassword(text);
        setCopied(true);
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
      }
    } catch {
      try { await navigator.clipboard.writeText(text); setCopied(true); } catch { /* fail */ }
    }
    if (copied) return;
    setTimeout(() => setCopied(false), 1500);
  };

  // Ensure timeout fires even on first success
  const onClick = async () => {
    await handleCopy();
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 14, color: colors.textPrimary, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {text}
      </span>
      <button
        type="button"
        onClick={onClick}
        aria-label={`复制 ${text}`}
        style={{
          padding: '2px 8px',
          fontSize: 12,
          border: `1px solid ${colors.border}`,
          borderRadius: 4,
          backgroundColor: colors.cardBg,
          color: copied ? colors.success : colors.textSecondary,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {copied ? '已复制 ✓' : '复制'}
      </button>
    </div>
  );
};

export default CopyableText;
