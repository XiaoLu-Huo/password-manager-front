import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '../api/api-client';
import { useAuth } from '../context/AuthContext';
import { useLoading } from '../context/LoadingContext';
import PasswordInput from '../components/PasswordInput';
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

      if (result.mfaRequired) {
        setMfaRequired(true);
      } else {
        unlock(result.sessionToken || 'authenticated');
        navigate(redirectTo, { replace: true });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '解锁失败');
    } finally {
      hideLoading();
    }
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
    } finally {
      hideLoading();
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 24,
      }}
    >
      <div style={{ width: '100%', maxWidth: 400 }}>
        <h1 style={{ fontSize: 24, margin: '0 0 16px', textAlign: 'center' }}>
          {mfaRequired ? 'MFA 验证' : '解锁密码库'}
        </h1>

        {error && (
          <p role="alert" style={{ color: '#d93025', fontSize: 13, margin: '0 0 12px', textAlign: 'center' }}>
            {error}
          </p>
        )}

        {!mfaRequired ? (
          <form onSubmit={handleUnlock} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <PasswordInput
              value={password}
              onChange={setPassword}
              placeholder="输入主密码"
            />
            <button
              type="submit"
              style={{
                padding: '10px 0',
                fontSize: 15,
                fontWeight: 600,
                color: '#fff',
                backgroundColor: '#1a73e8',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              解锁
            </button>
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
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: 14,
                border: '1px solid #dadce0',
                borderRadius: 6,
                outline: 'none',
                boxSizing: 'border-box',
                textAlign: 'center',
                letterSpacing: 4,
              }}
            />
            <button
              type="submit"
              style={{
                padding: '10px 0',
                fontSize: 15,
                fontWeight: 600,
                color: '#fff',
                backgroundColor: '#1a73e8',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              验证
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default UnlockPage;
