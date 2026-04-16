import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '../api/api-client';
import { useAuth } from '../context/AuthContext';
import { useLoading } from '../context/LoadingContext';
import PasswordInput from '../components/PasswordInput';
import { colors, cardStyle, primaryBtnStyle, inputStyle } from '../theme';
import type { UnlockVaultRequest, UnlockResultResponse, VerifyTotpRequest } from '../types/auth';

const UnlockPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { unlock } = useAuth();
  const { showLoading, hideLoading } = useLoading();

  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);
  const [error, setError] = useState('');

  const redirectTo = (location.state as { from?: { pathname: string } })?.from?.pathname || '/vault';

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    showLoading();
    try {
      const body: UnlockVaultRequest = { masterPassword: password };
      const result = await apiClient.post<UnlockResultResponse>('/auth/unlock', body);
      if (result.mfaRequired) { setMfaRequired(true); }
      else { unlock(result.sessionToken || 'authenticated'); navigate(redirectTo, { replace: true }); }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '解锁失败');
    } finally { hideLoading(); }
  };

  const handleVerifyTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    showLoading();
    try {
      const body: VerifyTotpRequest = { totpCode };
      const result = await apiClient.post<UnlockResultResponse>('/auth/verify-totp', body);
      unlock(result.sessionToken || 'authenticated');
      navigate(redirectTo, { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'TOTP 验证失败');
    } finally { hideLoading(); }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 24, backgroundColor: colors.pageBg }}>
      <div style={{ ...cardStyle, width: '100%', maxWidth: 420 }}>
        <h1 style={{ fontSize: 22, margin: '0 0 4px', textAlign: 'center', color: colors.textPrimary }}>
          {mfaRequired ? '🔑 MFA 验证' : '🔓 解锁密码库'}
        </h1>
        <p style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center', margin: '0 0 20px' }}>
          {mfaRequired ? '请输入验证器应用中的验证码' : '输入主密码以访问您的密码库'}
        </p>

        {error && (
          <p role="alert" style={{ color: colors.danger, fontSize: 13, margin: '0 0 12px', textAlign: 'center', padding: '8px 12px', backgroundColor: colors.dangerBg, borderRadius: 6 }}>
            {error}
          </p>
        )}

        {!mfaRequired ? (
          <form onSubmit={handleUnlock} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <PasswordInput value={password} onChange={setPassword} placeholder="输入主密码" />
            <button type="submit" style={{ ...primaryBtnStyle, padding: '12px 0', fontSize: 15, width: '100%' }}>解锁</button>
          </form>
        ) : (
          <form onSubmit={handleVerifyTotp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              placeholder="输入 6 位验证码"
              aria-label="TOTP 验证码"
              autoComplete="one-time-code"
              style={{ ...inputStyle, textAlign: 'center', letterSpacing: 6, fontSize: 20 }}
            />
            <button type="submit" style={{ ...primaryBtnStyle, padding: '12px 0', fontSize: 15, width: '100%' }}>验证</button>
          </form>
        )}

        <p style={{ fontSize: 11, color: colors.textMuted, textAlign: 'center', margin: '16px 0 0' }}>
          连续输错将临时锁定账户
        </p>
      </div>
    </div>
  );
};

export default UnlockPage;
