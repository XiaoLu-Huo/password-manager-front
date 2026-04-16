import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/api-client';
import { useLoading } from '../context/LoadingContext';
import { useAuth } from '../context/AuthContext';
import ConfirmDialog from '../components/ConfirmDialog';
import type { SettingsResponse, MfaSetupResponse } from '../types';
import {
  colors,
  cardStyle,
  inputStyle,
  labelStyle,
  primaryBtnStyle,
  secondaryBtnStyle,
  dangerBtnStyle,
  errorStyle,
} from '../theme';

type MfaStep = 'idle' | 'setup' | 'verify' | 'recovery' | 'done';

const SettingsPage: React.FC = () => {
  const { showLoading, hideLoading } = useLoading();
  const { lock } = useAuth();

  // ---- Auto-lock state ----
  const [autoLockMinutes, setAutoLockMinutes] = useState<number>(5);
  const [autoLockInput, setAutoLockInput] = useState<string>('5');
  const [autoLockError, setAutoLockError] = useState('');
  const [autoLockSuccess, setAutoLockSuccess] = useState('');

  // ---- MFA state ----
  const [mfaEnabled, setMfaEnabled] = useState<boolean>(false);
  const [mfaStep, setMfaStep] = useState<MfaStep>('idle');
  const [mfaSetupData, setMfaSetupData] = useState<MfaSetupResponse | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [mfaError, setMfaError] = useState('');
  const [mfaSuccess, setMfaSuccess] = useState('');
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);

  // ---- Load settings ----
  useEffect(() => {
    let cancelled = false;
    showLoading();
    apiClient
      .get<SettingsResponse>('/settings')
      .then((data) => {
        if (!cancelled) {
          setAutoLockMinutes(data.autoLockMinutes);
          setAutoLockInput(String(data.autoLockMinutes));
        }
      })
      .catch(() => {
        if (!cancelled) setAutoLockError('加载设置失败');
      })
      .finally(() => hideLoading());
    return () => { cancelled = true; };
  }, [showLoading, hideLoading]);

  // ---- Auto-lock handlers ----
  const handleAutoLockSave = async () => {
    setAutoLockError('');
    setAutoLockSuccess('');

    const value = parseInt(autoLockInput, 10);
    if (isNaN(value) || value < 1 || value > 60) {
      setAutoLockError('请输入 1-60 之间的整数');
      return;
    }

    showLoading();
    try {
      await apiClient.put<void>('/settings', { autoLockMinutes: value });
      setAutoLockMinutes(value);
      setAutoLockSuccess('自动锁定时间已更新');
    } catch (err: unknown) {
      setAutoLockError(err instanceof Error ? err.message : '保存失败');
    } finally {
      hideLoading();
    }
  };

  // ---- MFA enable flow ----
  const handleEnableMfa = async () => {
    setMfaError('');
    setMfaSuccess('');
    showLoading();
    try {
      const data = await apiClient.post<MfaSetupResponse>('/auth/mfa/enable', {});
      setMfaSetupData(data);
      setMfaStep('setup');
    } catch (err: unknown) {
      setMfaError(err instanceof Error ? err.message : '启用 MFA 失败');
    } finally {
      hideLoading();
    }
  };

  const handleVerifyTotp = async () => {
    setMfaError('');
    if (!totpCode.trim()) {
      setMfaError('请输入验证码');
      return;
    }

    showLoading();
    try {
      await apiClient.post<null>('/auth/mfa/enable', { totpCode: totpCode.trim() });
      setMfaStep('recovery');
    } catch (err: unknown) {
      setMfaError(err instanceof Error ? err.message : '验证码验证失败');
    } finally {
      hideLoading();
    }
  };

  const handleRecoveryDone = () => {
    setMfaEnabled(true);
    setMfaStep('idle');
    setMfaSetupData(null);
    setTotpCode('');
    setMfaSuccess('MFA 已成功启用');
  };

  // ---- MFA disable flow ----
  const handleDisableMfa = async () => {
    setShowDisableConfirm(false);
    setMfaError('');
    setMfaSuccess('');
    showLoading();
    try {
      await apiClient.post<void>('/auth/mfa/disable');
      setMfaEnabled(false);
      setMfaSuccess('MFA 已禁用');
    } catch (err: unknown) {
      setMfaError(err instanceof Error ? err.message : '禁用 MFA 失败');
    } finally {
      hideLoading();
    }
  };

  // ---- Lock vault ----
  const handleLockVault = async () => {
    showLoading();
    try {
      await apiClient.post<void>('/auth/lock');
    } catch {
      // Even if the API call fails, lock locally
    } finally {
      hideLoading();
      lock();
    }
  };

  // ---- MFA step cancel ----
  const handleMfaCancel = () => {
    setMfaStep('idle');
    setMfaSetupData(null);
    setTotpCode('');
    setMfaError('');
  };

  return (
    <div>
      <h1 style={{ fontSize: 22, margin: '0 0 24px', color: colors.textPrimary }}>设置</h1>

      {/* ---- Auto-lock Section ---- */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <h2 style={{ fontSize: 17, margin: '0 0 16px', color: colors.textPrimary }}>自动锁定</h2>
        <p style={{ fontSize: 13, color: colors.textSecondary, margin: '0 0 16px' }}>
          设置无操作后自动锁定密码库的时间（1-60 分钟）。
        </p>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 8 }}>
          <div style={{ flex: '0 0 160px' }}>
            <label htmlFor="auto-lock-minutes" style={labelStyle}>超时时间（分钟）</label>
            <input
              id="auto-lock-minutes"
              type="number"
              min={1}
              max={60}
              value={autoLockInput}
              onChange={(e) => {
                setAutoLockInput(e.target.value);
                setAutoLockError('');
                setAutoLockSuccess('');
              }}
              style={{ ...inputStyle, width: '100%' }}
            />
          </div>
          <button type="button" onClick={handleAutoLockSave} style={primaryBtnStyle}>
            保存
          </button>
        </div>

        {autoLockError && <p role="alert" style={errorStyle}>{autoLockError}</p>}
        {autoLockSuccess && (
          <p style={{ color: colors.success, fontSize: 12, margin: '4px 0 0' }}>{autoLockSuccess}</p>
        )}
      </div>

      {/* ---- MFA Section ---- */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <h2 style={{ fontSize: 17, margin: '0 0 16px', color: colors.textPrimary }}>
          多因素认证（MFA）
        </h2>

        {/* Status display */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 13, color: colors.textSecondary }}>当前状态：</span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: mfaEnabled ? colors.success : colors.textMuted,
            }}
          >
            {mfaEnabled ? '已启用' : '未启用'}
          </span>
        </div>

        {mfaError && <p role="alert" style={{ ...errorStyle, marginBottom: 12 }}>{mfaError}</p>}
        {mfaSuccess && (
          <p style={{ color: colors.success, fontSize: 12, margin: '0 0 12px' }}>{mfaSuccess}</p>
        )}

        {/* Idle state: show enable/disable button */}
        {mfaStep === 'idle' && (
          <>
            {!mfaEnabled ? (
              <button type="button" onClick={handleEnableMfa} style={primaryBtnStyle}>
                启用 MFA
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowDisableConfirm(true)}
                style={dangerBtnStyle}
              >
                禁用 MFA
              </button>
            )}
          </>
        )}

        {/* Setup step: show QR code URI */}
        {mfaStep === 'setup' && mfaSetupData && (
          <div>
            <p style={{ fontSize: 14, color: colors.textPrimary, margin: '0 0 12px' }}>
              请使用身份验证器应用（如 Google Authenticator）扫描以下链接或手动输入：
            </p>
            <div
              style={{
                padding: 12,
                backgroundColor: colors.inputBg,
                border: `1px solid ${colors.border}`,
                borderRadius: 8,
                marginBottom: 16,
                wordBreak: 'break-all',
                fontSize: 13,
                color: colors.textPrimary,
                fontFamily: 'monospace',
                userSelect: 'all',
              }}
              data-testid="mfa-uri"
            >
              {mfaSetupData.qrCodeUri}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label htmlFor="totp-code" style={labelStyle}>验证码</label>
              <input
                id="totp-code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={totpCode}
                onChange={(e) => {
                  setTotpCode(e.target.value.replace(/\D/g, ''));
                  setMfaError('');
                }}
                placeholder="输入 6 位验证码"
                style={{ ...inputStyle, maxWidth: 200 }}
              />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={handleVerifyTotp} style={primaryBtnStyle}>
                验证并启用
              </button>
              <button type="button" onClick={handleMfaCancel} style={secondaryBtnStyle}>
                取消
              </button>
            </div>
          </div>
        )}

        {/* Recovery step: show recovery codes */}
        {mfaStep === 'recovery' && mfaSetupData && (
          <div>
            <p style={{ fontSize: 14, color: colors.textPrimary, margin: '0 0 8px', fontWeight: 600 }}>
              MFA 启用成功！请妥善保存以下恢复码：
            </p>
            <p style={{ fontSize: 13, color: colors.textSecondary, margin: '0 0 12px' }}>
              如果您无法使用身份验证器应用，可以使用恢复码登录。每个恢复码只能使用一次。
            </p>
            <div
              style={{
                padding: 16,
                backgroundColor: colors.inputBg,
                border: `1px solid ${colors.border}`,
                borderRadius: 8,
                marginBottom: 16,
                fontFamily: 'monospace',
                fontSize: 14,
                lineHeight: 2,
                userSelect: 'all',
              }}
              data-testid="recovery-codes"
            >
              {mfaSetupData.recoveryCodes.map((code, i) => (
                <div key={i}>{code}</div>
              ))}
            </div>
            <button type="button" onClick={handleRecoveryDone} style={primaryBtnStyle}>
              我已保存恢复码
            </button>
          </div>
        )}
      </div>

      {/* ---- Lock Vault Section ---- */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: 17, margin: '0 0 16px', color: colors.textPrimary }}>锁定密码库</h2>
        <p style={{ fontSize: 13, color: colors.textSecondary, margin: '0 0 16px' }}>
          立即锁定密码库，需要重新输入主密码才能访问。
        </p>
        <button type="button" onClick={handleLockVault} style={dangerBtnStyle}>
          锁定密码库
        </button>
      </div>

      {/* ---- Disable MFA Confirm Dialog ---- */}
      <ConfirmDialog
        open={showDisableConfirm}
        title="禁用 MFA"
        message="禁用多因素认证后，登录时将不再需要验证码。确定要禁用吗？"
        confirmLabel="禁用"
        cancelLabel="取消"
        onConfirm={handleDisableMfa}
        onCancel={() => setShowDisableConfirm(false)}
      />
    </div>
  );
};

export default SettingsPage;
