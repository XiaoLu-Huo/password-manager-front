import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/api-client';
import { useLoading } from '../context/LoadingContext';
import PasswordInput from '../components/PasswordInput';
import { colors, cardStyle, primaryBtnStyle } from '../theme';
import type { CreateMasterPasswordRequest } from '../types/auth';

const SetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { showLoading, hideLoading } = useLoading();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [apiError, setApiError] = useState('');

  const hasMinLength = password.length >= 12;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const typesCount = [hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length;
  const hasEnoughTypes = typesCount >= 3;

  // Strength bar
  const strengthPercent = Math.min(100, (password.length >= 12 ? 40 : (password.length / 12) * 40) + typesCount * 15);
  const strengthColor = strengthPercent < 40 ? colors.danger : strengthPercent < 70 ? colors.warning : colors.success;
  const strengthLabel = strengthPercent < 40 ? '弱' : strengthPercent < 70 ? '中' : '强';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    setConfirmError('');
    if (password !== confirmPassword) { setConfirmError('两次输入的密码不一致'); return; }

    showLoading();
    try {
      const body: CreateMasterPasswordRequest = { masterPassword: password };
      await apiClient.post<void>('/auth/setup', body);
      navigate('/unlock', { replace: true });
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : '设置主密码失败');
    } finally { hideLoading(); }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 24, backgroundColor: colors.pageBg }}>
      <div style={{ ...cardStyle, width: '100%', maxWidth: 420 }}>
        <h1 style={{ fontSize: 22, margin: '0 0 4px', textAlign: 'center', color: colors.textPrimary }}>🔐 设置主密码</h1>
        <p style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center', margin: '0 0 20px' }}>首次使用，请创建一个安全的主密码</p>

        {apiError && (
          <p role="alert" style={{ color: colors.danger, fontSize: 13, margin: '0 0 12px', textAlign: 'center', padding: '8px 12px', backgroundColor: colors.dangerBg, borderRadius: 6 }}>
            {apiError}
          </p>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <PasswordInput value={password} onChange={setPassword} placeholder="输入主密码" />

          {password.length > 0 && (
            <>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: colors.textSecondary }}>密码强度</span>
                  <span style={{ color: strengthColor, fontWeight: 600 }}>{strengthLabel}</span>
                </div>
                <div style={{ height: 4, backgroundColor: colors.border, borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${strengthPercent}%`, backgroundColor: strengthColor, borderRadius: 2, transition: 'width 0.3s, background-color 0.3s' }} />
                </div>
              </div>
              <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: 12, listStyle: 'none' }}>
                <li style={{ color: hasMinLength ? colors.success : colors.textMuted }}>
                  {hasMinLength ? '✓' : '○'} 至少 12 个字符
                </li>
                <li style={{ color: hasEnoughTypes ? colors.success : colors.textMuted }}>
                  {hasEnoughTypes ? '✓' : '○'} 包含至少三种字符类型（大写、小写、数字、特殊字符）
                </li>
              </ul>
            </>
          )}

          <PasswordInput
            value={confirmPassword}
            onChange={(v) => { setConfirmPassword(v); if (confirmError) setConfirmError(''); }}
            placeholder="确认主密码"
            error={confirmError}
          />

          <button type="submit" style={{ ...primaryBtnStyle, padding: '12px 0', fontSize: 15, width: '100%' }}>
            创建主密码
          </button>

          <p style={{ fontSize: 11, color: colors.textMuted, textAlign: 'center', margin: 0 }}>
            建议同时启用 MFA 双因素认证以增强安全性
          </p>
        </form>
      </div>
    </div>
  );
};

export default SetupPage;
