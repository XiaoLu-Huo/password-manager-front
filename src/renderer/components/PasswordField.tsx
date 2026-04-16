import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '../api/api-client';
import { colors } from '../theme';

export interface PasswordFieldProps {
  credentialId: number;
  maskedPassword: string;
}

const AUTO_MASK_SECONDS = 30;

const PasswordField: React.FC<PasswordFieldProps> = ({ credentialId, maskedPassword }) => {
  const [revealed, setRevealed] = useState(false);
  const [plaintext, setPlaintext] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const maskTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (maskTimerRef.current) { clearTimeout(maskTimerRef.current); maskTimerRef.current = null; }
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
  }, []);

  const mask = useCallback(() => {
    setRevealed(false);
    setPlaintext('');
    setCountdown(0);
    clearTimers();
  }, [clearTimers]);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const startCountdown = useCallback(() => {
    setCountdown(AUTO_MASK_SECONDS);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          mask();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    maskTimerRef.current = setTimeout(mask, AUTO_MASK_SECONDS * 1000);
  }, [mask]);

  const handleReveal = async () => {
    if (revealed) { mask(); return; }
    setLoading(true);
    try {
      const data = await apiClient.post<string>(`/credentials/${credentialId}/reveal-password`);
      setPlaintext(data);
      setRevealed(true);
      clearTimers();
      startCountdown();
    } catch { /* user can retry */ }
    finally { setLoading(false); }
  };

  const copyToClipboard = async (text: string) => {
    try {
      if (window.electronBridge?.clipboard) {
        await window.electronBridge.clipboard.copyPassword(text);
        return true;
      }
    } catch { /* fall through */ }
    // Fallback to browser Clipboard API
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch { return false; }
  };

  const handleCopy = async () => {
    try {
      const password = plaintext || (await apiClient.post<string>(`/credentials/${credentialId}/reveal-password`));
      const ok = await copyToClipboard(password);
      if (ok) {
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 1500);
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
      {revealed && countdown > 0 && (
        <span style={{ fontSize: 11, color: colors.textMuted, whiteSpace: 'nowrap' }}>{countdown}s</span>
      )}
      <button type="button" onClick={handleReveal} disabled={loading} aria-label={revealed ? '隐藏密码' : '显示密码'} style={smallBtnStyle}>
        {loading ? '...' : revealed ? '隐藏' : '显示'}
      </button>
      <button type="button" onClick={handleCopy} aria-label="复制密码" style={{ ...smallBtnStyle, color: copyFeedback ? colors.success : colors.textPrimary }}>
        {copyFeedback ? '已复制 ✓' : '复制'}
      </button>
    </div>
  );
};

export default PasswordField;
