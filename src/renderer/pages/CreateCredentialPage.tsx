import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/api-client';
import { useLoading } from '../context/LoadingContext';
import type { CreateCredentialRequest, CredentialResponse, GeneratedPasswordResponse } from '../types';

const CreateCredentialPage: React.FC = () => {
  const navigate = useNavigate();
  const { showLoading, hideLoading } = useLoading();

  const [form, setForm] = useState({
    accountName: '',
    username: '',
    password: '',
    url: '',
    notes: '',
    tags: '',
  });
  const [autoGenerate, setAutoGenerate] = useState(false);
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
    } catch {
      // Silently fail
    }
  };

  const handleAutoGenerateToggle = async () => {
    const next = !autoGenerate;
    setAutoGenerate(next);
    if (next) {
      setErrors((e) => ({ ...e, password: '' }));
      await handleGeneratePassword();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;

    showLoading();
    try {
      const body: CreateCredentialRequest = {
        accountName: form.accountName.trim(),
        username: form.username.trim(),
        password: form.password,
        url: form.url.trim() || undefined,
        notes: form.notes.trim() || undefined,
        tags: form.tags.trim() || undefined,
        autoGenerate,
      };
      await apiClient.post<CredentialResponse>('/credentials', body);
      navigate('/vault', { replace: true });
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : '创建凭证失败');
    } finally {
      hideLoading();
    }
  };

  return (
    <div style={{ maxWidth: 500 }}>
      <button type="button" onClick={() => navigate('/vault')} style={linkBtnStyle}>← 返回密码库</button>
      <h1 style={{ fontSize: 22, margin: '16px 0' }}>新建凭证</h1>

      {apiError && <p role="alert" style={{ color: '#d93025', fontSize: 13, marginBottom: 12 }}>{apiError}</p>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field label="账户名称 *" value={form.accountName} onChange={(v) => setForm((f) => ({ ...f, accountName: v }))} error={errors.accountName} />
        <Field label="用户名 *" value={form.username} onChange={(v) => setForm((f) => ({ ...f, username: v }))} error={errors.username} />

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <label style={labelStyle}>密码 *</label>
            <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
              <input type="checkbox" checked={autoGenerate} onChange={handleAutoGenerateToggle} />
              自动生成
            </label>
          </div>
          <input
            type="text"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            placeholder={autoGenerate ? '已自动生成' : '输入密码'}
            readOnly={autoGenerate}
            style={{ ...inputStyle, backgroundColor: autoGenerate ? '#f8f9fa' : '#fff' }}
          />
          {errors.password && <p role="alert" style={errorStyle}>{errors.password}</p>}
        </div>

        <Field label="URL" value={form.url} onChange={(v) => setForm((f) => ({ ...f, url: v }))} />
        <div>
          <label style={labelStyle}>备注</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>
        <Field label="标签（逗号分隔）" value={form.tags} onChange={(v) => setForm((f) => ({ ...f, tags: v }))} />

        <button type="submit" style={primaryBtnStyle}>创建凭证</button>
      </form>
    </div>
  );
};

const Field: React.FC<{ label: string; value: string; onChange: (v: string) => void; error?: string }> = ({ label, value, onChange, error }) => (
  <div>
    <label style={labelStyle}>{label}</label>
    <input type="text" value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle} />
    {error && <p role="alert" style={errorStyle}>{error}</p>}
  </div>
);

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, color: '#5f6368', marginBottom: 4 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', fontSize: 14, border: '1px solid #dadce0', borderRadius: 6, outline: 'none', boxSizing: 'border-box' };
const primaryBtnStyle: React.CSSProperties = { padding: '10px 0', fontSize: 15, fontWeight: 600, color: '#fff', backgroundColor: '#1a73e8', border: 'none', borderRadius: 6, cursor: 'pointer', marginTop: 8 };
const linkBtnStyle: React.CSSProperties = { background: 'none', border: 'none', color: '#1a73e8', fontSize: 14, cursor: 'pointer', padding: 0 };
const errorStyle: React.CSSProperties = { color: '#d93025', fontSize: 12, margin: '4px 0 0' };

export default CreateCredentialPage;
