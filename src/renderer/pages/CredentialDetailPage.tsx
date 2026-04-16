import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/api-client';
import { useLoading } from '../context/LoadingContext';
import PasswordField from '../components/PasswordField';
import ConfirmDialog from '../components/ConfirmDialog';
import { colors, cardStyle, inputStyle, labelStyle, primaryBtnStyle, secondaryBtnStyle, dangerBtnStyle, linkBtnStyle, errorStyle } from '../theme';
import type { CredentialResponse, UpdateCredentialRequest, GeneratedPasswordResponse, PasswordHistoryResponse } from '../types';

const CredentialDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showLoading, hideLoading } = useLoading();

  const [credential, setCredential] = useState<CredentialResponse | null>(null);
  const [editing, setEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({ accountName: '', username: '', password: '', url: '', notes: '', tags: '' });

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    showLoading();
    apiClient.get<CredentialResponse>(`/credentials/${id}`)
      .then((data) => {
        if (!cancelled) {
          setCredential(data);
          setForm({ accountName: data.accountName, username: data.username, password: '', url: data.url || '', notes: data.notes || '', tags: data.tags || '' });
        }
      })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : '获取凭证详情失败'); })
      .finally(() => hideLoading());
    return () => { cancelled = true; };
  }, [id, showLoading, hideLoading]);

  const handleSave = async () => {
    if (!id) return;
    showLoading(); setError('');
    try {
      const body: UpdateCredentialRequest = { accountName: form.accountName, username: form.username, url: form.url || undefined, notes: form.notes || undefined, tags: form.tags || undefined };
      if (form.password) body.password = form.password;
      const updated = await apiClient.put<CredentialResponse>(`/credentials/${id}`, body);
      setCredential(updated); setEditing(false); setForm((f) => ({ ...f, password: '' }));
    } catch (err: unknown) { setError(err instanceof Error ? err.message : '保存失败'); }
    finally { hideLoading(); }
  };

  const handleDelete = async () => {
    if (!id) return;
    showLoading();
    try { await apiClient.delete(`/credentials/${id}`); navigate('/vault', { replace: true }); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : '删除失败'); }
    finally { hideLoading(); setShowDeleteConfirm(false); }
  };

  const handleGeneratePassword = async () => {
    try {
      const result = await apiClient.post<GeneratedPasswordResponse>('/password-generator/generate', { useDefault: true });
      setForm((f) => ({ ...f, password: result.password }));
    } catch { /* silently fail */ }
  };

  const handleCancelEdit = () => {
    if (!credential) return;
    setEditing(false);
    setForm({ accountName: credential.accountName, username: credential.username, password: '', url: credential.url || '', notes: credential.notes || '', tags: credential.tags || '' });
  };

  if (error && !credential) {
    return (
      <div style={{ textAlign: 'center', padding: 32, ...cardStyle }}>
        <p role="alert" style={{ color: colors.danger, marginBottom: 12 }}>{error}</p>
        <button type="button" onClick={() => navigate('/vault')} style={linkBtnStyle}>返回密码库</button>
      </div>
    );
  }

  if (!credential) return null;

  return (
    <div style={{ maxWidth: 620, margin: '0 auto' }}>
      <button type="button" onClick={() => navigate('/vault')} style={{ ...linkBtnStyle, marginBottom: 16 }}>← 返回密码库</button>

      {error && <p role="alert" style={{ ...errorStyle, fontSize: 13, marginBottom: 12, padding: '8px 12px', backgroundColor: colors.dangerBg, borderRadius: 6 }}>{error}</p>}

      <div style={cardStyle}>
        {!editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <DetailRow label="账户名称" value={credential.accountName} />
            <DetailRow label="用户名" value={credential.username} />
            <div>
              <label style={labelStyle}>密码</label>
              <PasswordField credentialId={credential.id} maskedPassword={credential.maskedPassword} />
              <p style={{ fontSize: 11, color: colors.textMuted, margin: '4px 0 0' }}>显示后 30 秒自动掩码</p>
            </div>
            {credential.url && <DetailRow label="URL" value={credential.url} />}
            {credential.notes && <DetailRow label="备注" value={credential.notes} />}
            {credential.tags && <DetailRow label="标签" value={credential.tags} />}
            <div style={{ display: 'flex', gap: 12 }}>
              <DetailRow label="创建时间" value={credential.createdAt} />
              <DetailRow label="更新时间" value={credential.updatedAt} />
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 4, borderTop: `1px solid ${colors.border}`, paddingTop: 16 }}>
              <button type="button" onClick={() => setEditing(true)} style={primaryBtnStyle}>编辑</button>
              <button type="button" onClick={() => setShowHistory(!showHistory)} style={secondaryBtnStyle}>
                {showHistory ? '隐藏历史' : '密码历史'}
              </button>
              <button type="button" onClick={() => setShowDeleteConfirm(true)} style={dangerBtnStyle}>删除</button>
            </div>

            {showHistory && <PasswordHistoryPanel credentialId={credential.id} />}
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <FormField label="账户名称 *" value={form.accountName} onChange={(v) => setForm((f) => ({ ...f, accountName: v }))} />
            <FormField label="用户名 *" value={form.username} onChange={(v) => setForm((f) => ({ ...f, username: v }))} />
            <div>
              <label style={labelStyle}>密码（留空则不修改）</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="text" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="输入新密码" style={{ ...inputStyle, flex: 1 }} />
                <button type="button" onClick={handleGeneratePassword} style={secondaryBtnStyle}>🔄 生成</button>
              </div>
            </div>
            <FormField label="URL" value={form.url} onChange={(v) => setForm((f) => ({ ...f, url: v }))} />
            <div>
              <label style={labelStyle}>备注</label>
              <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <FormField label="标签（逗号分隔）" value={form.tags} onChange={(v) => setForm((f) => ({ ...f, tags: v }))} />
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button type="submit" style={primaryBtnStyle}>保存</button>
              <button type="button" onClick={handleCancelEdit} style={secondaryBtnStyle}>取消</button>
            </div>
          </form>
        )}
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="删除凭证"
        message={`确定要删除「${credential.accountName}」吗？此操作不可撤销。`}
        confirmLabel="删除"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
};

// ---- Helpers ----

const DetailRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <label style={labelStyle}>{label}</label>
    <div style={{ fontSize: 14, color: colors.textPrimary }}>{value}</div>
  </div>
);

const FormField: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <div>
    <label style={labelStyle}>{label}</label>
    <input type="text" value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle} />
  </div>
);

const PasswordHistoryPanel: React.FC<{ credentialId: number }> = ({ credentialId }) => {
  const [history, setHistory] = useState<PasswordHistoryResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiClient.get<PasswordHistoryResponse[]>(`/credentials/${credentialId}/password-history`)
      .then((data) => { if (!cancelled) setHistory(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [credentialId]);

  if (loading) return <p style={{ fontSize: 13, color: colors.textMuted }}>加载中...</p>;
  if (history.length === 0) return <p style={{ fontSize: 13, color: colors.textMuted }}>暂无密码变更记录</p>;

  return (
    <div style={{ border: `1px solid ${colors.border}`, borderRadius: 8, padding: 12, backgroundColor: colors.pageBg }}>
      <h3 style={{ fontSize: 14, margin: '0 0 8px', color: colors.textPrimary }}>密码历史（最近 10 条）</h3>
      {history.map((h) => (
        <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${colors.border}`, fontSize: 13 }}>
          <span style={{ fontFamily: 'monospace', color: colors.textPrimary }}>{h.maskedPassword}</span>
          <span style={{ color: colors.textMuted }}>{h.changedAt}</span>
        </div>
      ))}
    </div>
  );
};

export default CredentialDetailPage;
