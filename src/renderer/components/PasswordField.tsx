import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '../api/api-client';
import { colors } from '../theme';

export interface PasswordFieldProps {
  credentialId: number;
  maskedPassword: string;
}

const AUTO_MASK_DELAY = 30_000;

const PasswordField: React.FC<PasswordFieldProps> = ({ credentialId, maskedPassword }) => {
  const [revealed, setRevealed] = useState(false);
  const [plaintext, setPlaintext] = useState('');
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mask = useCallback(() => {
    setRevealed(false);
    setPlaintext('');
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }, []);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const handleReveal = async () => {
    if (revealed) { mask(); return; }
    setLoading(true);
    try {
      const data = await apiClient.get<string>(`/credentials/${credentialId}/reveal-password`);
      setPlaintext(data);
      setRevealed(true);
      timerRef.current = setTimeout(mask, AUTO_MASK_DELAY);
    } catch { /* user can retry */ } finally { setLoading(false); }
  };

  const handleCopy = async () => {
    try {
      if (window.electronBridge?.clipboard) {
        const password = plaintext || (await apiClient.get<string>(`/credentials/${credentialId}/reveal-password`));
        await window.electronBridge.clipboard.copyPassword(password);
      }
    } catch { /* silently fail */ }
  };

  const smallBtnStyle: React.CSSProperties = {
    padding: '4px 10px',
    fontSize: 13,
    border: `1px solid ${colors.border}`,
    borderRadius: 6,
    backgroundColor: colors.cardBg,
    color: colors.textPrimary,
    cursor: loading ? 'wait' : 'pointer',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontFamily: 'monospace', fontSize: 14, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: colors.textPrimary }}>
        {revealed ? plaintext : maskedPassword}
      </span>
      <button type="button" onClick={handleReveal} disabled={loading} aria-label={revealed ? '隐藏密码' : '显示密码'} style={smallBtnStyle}>
        {loading ? '...' : revealed ? '隐藏' : '显示'}
      </button>
      <button type="button" onClick={handleCopy} aria-label="复制密码" style={smallBtnStyle}>复制</button>
    </div>
  );
};

export default PasswordField;
