import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/api-client';
import { colors } from '../theme';
import type { PasswordHistoryResponse } from '../types';

export interface PasswordHistoryPanelProps {
  credentialId: number;
}

const PasswordHistoryPanel: React.FC<PasswordHistoryPanelProps> = ({ credentialId }) => {
  const [history, setHistory] = useState<PasswordHistoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealedMap, setRevealedMap] = useState<Record<number, string>>({});
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiClient.get<PasswordHistoryResponse[]>(`/credentials/${credentialId}/password-history`)
      .then((data) => { if (!cancelled) setHistory(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [credentialId]);

  const handleReveal = async (historyId: number) => {
    if (revealedMap[historyId]) {
      setRevealedMap((m) => { const copy = { ...m }; delete copy[historyId]; return copy; });
      return;
    }
    try {
      const plaintext = await apiClient.post<string>(`/credentials/${credentialId}/password-history/${historyId}/reveal`);
      setRevealedMap((m) => ({ ...m, [historyId]: plaintext }));
      setTimeout(() => {
        setRevealedMap((m) => { const copy = { ...m }; delete copy[historyId]; return copy; });
      }, 30_000);
    } catch { /* silently fail */ }
  };

  const handleCopy = async (historyId: number) => {
    try {
      const plaintext = revealedMap[historyId] || await apiClient.post<string>(`/credentials/${credentialId}/password-history/${historyId}/reveal`);
      try {
        if (window.electronBridge?.clipboard) {
          await window.electronBridge.clipboard.copyPassword(plaintext);
          setCopiedId(historyId);
          setTimeout(() => setCopiedId(null), 1500);
          return;
        }
      } catch { /* fall through */ }
      await navigator.clipboard.writeText(plaintext);
      setCopiedId(historyId);
      setTimeout(() => setCopiedId(null), 1500);
    } catch { /* silently fail */ }
  };

  if (loading) return <p style={{ fontSize: 13, color: colors.textMuted }}>加载中...</p>;
  if (history.length === 0) return <p style={{ fontSize: 13, color: colors.textMuted }}>暂无密码变更记录</p>;

  const smallBtnStyle: React.CSSProperties = {
    padding: '2px 8px', fontSize: 12, border: `1px solid ${colors.border}`, borderRadius: 4,
    backgroundColor: colors.cardBg, color: colors.textPrimary, cursor: 'pointer',
  };

  return (
    <div style={{ border: `1px solid ${colors.border}`, borderRadius: 8, padding: 12, backgroundColor: colors.pageBg }}>
      <h3 style={{ fontSize: 14, margin: '0 0 8px', color: colors.textPrimary }}>密码历史（最近 10 条）</h3>
      {history.map((h) => (
        <div key={h.id} style={{ display: 'flex', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${colors.border}`, fontSize: 13, gap: 8 }}>
          <span style={{ fontFamily: 'monospace', color: colors.textPrimary, flex: 1 }}>
            {revealedMap[h.id] || h.maskedPassword}
          </span>
          <span style={{ color: colors.textMuted, whiteSpace: 'nowrap' }}>{h.changedAt}</span>
          <button type="button" onClick={() => handleReveal(h.id)} style={smallBtnStyle}>
            {revealedMap[h.id] ? '隐藏' : '显示'}
          </button>
          <button type="button" onClick={() => handleCopy(h.id)} style={{ ...smallBtnStyle, color: copiedId === h.id ? colors.success : colors.textPrimary }}>
            {copiedId === h.id ? '已复制 ✓' : '复制'}
          </button>
        </div>
      ))}
    </div>
  );
};

export default PasswordHistoryPanel;
