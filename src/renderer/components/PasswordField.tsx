import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '../api/api-client';

export interface PasswordFieldProps {
  credentialId: number;
  maskedPassword: string;
}

const AUTO_MASK_DELAY = 30_000; // 30 seconds

const PasswordField: React.FC<PasswordFieldProps> = ({ credentialId, maskedPassword }) => {
  const [revealed, setRevealed] = useState(false);
  const [plaintext, setPlaintext] = useState('');
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mask = useCallback(() => {
    setRevealed(false);
    setPlaintext('');
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleReveal = async () => {
    if (revealed) {
      mask();
      return;
    }
    setLoading(true);
    try {
      const data = await apiClient.get<string>(`/credentials/${credentialId}/reveal-password`);
      setPlaintext(data);
      setRevealed(true);
      // Auto-mask after 30 seconds
      timerRef.current = setTimeout(mask, AUTO_MASK_DELAY);
    } catch {
      // Silently fail — user can retry
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      // Try Electron IPC first, fall back to Clipboard API
      if (window.electronBridge?.clipboard) {
        const password = plaintext || (await apiClient.get<string>(`/credentials/${credentialId}/reveal-password`));
        await window.electronBridge.clipboard.copyPassword(password);
      }
    } catch {
      // Silently fail
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span
        style={{
          fontFamily: 'monospace',
          fontSize: 14,
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {revealed ? plaintext : maskedPassword}
      </span>
      <button
        type="button"
        onClick={handleReveal}
        disabled={loading}
        aria-label={revealed ? '隐藏密码' : '显示密码'}
        style={{
          padding: '4px 8px',
          fontSize: 13,
          border: '1px solid #dadce0',
          borderRadius: 4,
          backgroundColor: '#fff',
          cursor: loading ? 'wait' : 'pointer',
        }}
      >
        {loading ? '...' : revealed ? '隐藏' : '显示'}
      </button>
      <button
        type="button"
        onClick={handleCopy}
        aria-label="复制密码"
        style={{
          padding: '4px 8px',
          fontSize: 13,
          border: '1px solid #dadce0',
          borderRadius: 4,
          backgroundColor: '#fff',
          cursor: 'pointer',
        }}
      >
        复制
      </button>
    </div>
  );
};

export default PasswordField;
