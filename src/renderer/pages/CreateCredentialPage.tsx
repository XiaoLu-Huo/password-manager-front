import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/api-client';
import { useLoading } from '../context/LoadingContext';
import { colors, cardStyle, inputStyle, labelStyle, primaryBtnStyle, secondaryBtnStyle, linkBtnStyle, errorStyle } from '../theme';
import type { CreateCredentialRequest, CredentialResponse, GeneratedPasswordResponse } from '../types';

const CreateCredentialPage: React.FC = () => {
  const navigate = useNavigate();
  const { showLoading, hideLoading } = useLoading();

  const [form, setForm] = useState({ accountName: '', username: '', password: '', url: '', notes: '', tags: '' });
  const [autoGenerate, setAutoGenerate] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.accountName.trim()) errs.accountName = '账户名称不能为空';
    if (!form.username.trim()) errs.username = '用户名不能为空';
    if (!form.password.trim() && !autoGenerate) errs.password = '密码不能为空';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleGeneratePassword = async () => {
    try {
      const result = await apiClient.post<GeneratedPasswordResponse>('/password-generator/generate', { useDefault: true });
      setForm((f) => ({ ...f, password: result.password }));
      setAutoGenerate(true);
      setShowPassword(true);
      setErrors((e) => { const { password: _, ...rest } = e; return rest; });
    } catch { /* silently fail */ }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;
    showLoading();
    try {
      const body: CreateCredentialRequest = {
        accountName: form.accountName.trim(), username: form.username.trim(), password: form.password,
        url: form.url.trim() || undefined, notes: form.notes.trim() || undefined, tags: form.tags.trim() || undefined, autoGenerate,
      };
      await apiClient.post<CredentialResponse>('/credentials', body);
      navigate('/vault', { replace: true });
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : '创建凭证失败');
    } finally { hideLoading(); }
  };

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <button type="button" onClick={() => navigate('/vault')} style={{ ...linkBtnStyle, marginBottom: 16 }}>← 返回密码库</button>

      <div style={cardStyle}>
        <h1 style={{ fontSize: 20, margin: '0 0 20px', color: colors.textPrimary }}>新增账户凭证</h1>

        {apiError && (
          <p role="alert" style={{ color: colors.danger, fontSize: 13, margin: '0 0 12px', padding: '8px 12px', backgroundColor: colors.dangerBg, borderRadius: 6 }}>{apiError}</p>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="账户名称" value={form.accountName} onChange={(v) => setForm((f) => ({ ...f, accountName: v }))} error={errors.accountName} required placeholder="例如：GitHub" />
          <Field label="用户名" value={form.username} onChange={(v) => setForm((f) => ({ ...f, username: v }))} error={errors.username} required placeholder="例如：user@example.com" />

          <div>
            <label style={labelStyle}>密码 <span style={{ color: colors.danger }}>*</span></label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => { setForm((f) => ({ ...f, password: e.target.value })); setAutoGenerate(false); }}
                  placeholder="输入密码"
                  style={inputStyle}
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? '隐藏密码' : '显示密码'}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 2, color: colors.textSecondary }}>
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              <button type="button" onClick={handleGeneratePassword} style={{ ...secondaryBtnStyle, whiteSpace: 'nowrap', padding: '10px 14px' }}>🔄 生成</button>
            </div>
            {errors.password && <p role="alert" style={errorStyle}>{errors.password}</p>}
          </div>

          <Field label="URL" value={form.url} onChange={(v) => setForm((f) => ({ ...f, url: v }))} placeholder="https://example.com" />
          <div>
            <label style={labelStyle}>备注</label>
            <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={3} placeholder="可选备注信息" style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }} />
          </div>
          <Field label="分类标签" value={form.tags} onChange={(v) => setForm((f) => ({ ...f, tags: v }))} placeholder="逗号分隔，例如：工作,社交" />

          <button type="submit" style={{ ...primaryBtnStyle, padding: '12px 0', fontSize: 15, width: '100%', marginTop: 4 }}>保存凭证</button>
        </form>
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; value: string; onChange: (v: string) => void; error?: string; required?: boolean; placeholder?: string }> = ({ label, value, onChange, error, required, placeholder }) => (
  <div>
    <label style={labelStyle}>{label} {required && <span style={{ color: colors.danger }}>*</span>}</label>
    <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
    {error && <p role="alert" style={errorStyle}>{error}</p>}
  </div>
);

export default CreateCredentialPage;
