import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/api-client';
import { useLoading } from '../context/LoadingContext';
import PasswordInput from '../components/PasswordInput';
import { colors, cardStyle, primaryBtnStyle, inputStyle } from '../theme';
import type { RegisterRequest } from '../types/auth';

/**
 * 计算密码中包含的字符类型数量（与后端 User.countCharacterTypes 逻辑一致）。
 */
export function countCharacterTypes(password: string): number {
  let hasUpper = false;
  let hasLower = false;
  let hasDigit = false;
  let hasSpecial = false;

  for (const c of password) {
    if (c >= 'A' && c <= 'Z') hasUpper = true;
    else if (c >= 'a' && c <= 'z') hasLower = true;
    else if (c >= '0' && c <= '9') hasDigit = true;
    else hasSpecial = true;
  }

  let count = 0;
  if (hasUpper) count++;
  if (hasLower) count++;
  if (hasDigit) count++;
  if (hasSpecial) count++;
  return count;
}

/**
 * 计算密码强度百分比（与 SetupPage 逻辑一致）。
 */
export function computeStrengthPercent(password: string): number {
  const typesCount = countCharacterTypes(password);
  return Math.min(100, (password.length >= 12 ? 40 : (password.length / 12) * 40) + typesCount * 15);
}

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { showLoading, hideLoading } = useLoading();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [apiError, setApiError] = useState('');

  const hasMinLength = password.length >= 12;
  const typesCount = countCharacterTypes(password);
  const hasEnoughTypes = typesCount >= 3;

  const strengthPercent = computeStrengthPercent(password);
  const strengthColor = strengthPercent < 40 ? colors.danger : strengthPercent < 70 ? colors.warning : colors.success;
  const strengthLabel = strengthPercent < 40 ? '弱' : strengthPercent < 70 ? '中' : '强';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    setConfirmError('');
    if (password !== confirmPassword) { setConfirmError('两次输入的密码不一致'); return; }

    showLoading();
    try {
      const body: RegisterRequest = { username, email, masterPassword: password };
      await apiClient.post<void>('/auth/register', body);
      navigate('/login', { replace: true });
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : '注册失败');
    } finally { hideLoading(); }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 24, backgroundColor: colors.pageBg }}>
      <div style={{ ...cardStyle, width: '100%', maxWidth: 420 }}>
        <h1 style={{ fontSize: 22, margin: '0 0 4px', textAlign: 'center', color: colors.textPrimary }}>🔐 注册账户</h1>
        <p style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center', margin: '0 0 20px' }}>创建您的密码管理器账户</p>

        {apiError && (
          <p role="alert" style={{ color: colors.danger, fontSize: 13, margin: '0 0 12px', textAlign: 'center', padding: '8px 12px', backgroundColor: colors.dangerBg, borderRadius: 6 }}>
            {apiError}
          </p>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="用户名"
            aria-label="用户名"
            autoComplete="username"
            style={inputStyle}
          />

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="邮箱"
            aria-label="邮箱"
            autoComplete="email"
            style={inputStyle}
          />

          <PasswordInput value={password} onChange={setPassword} placeholder="主密码" />

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
            注册
          </button>

          <p style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center', margin: 0 }}>
            已有账户？{' '}
            <a href="#/login" style={{ color: colors.textLink, textDecoration: 'none' }}>去登录</a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
