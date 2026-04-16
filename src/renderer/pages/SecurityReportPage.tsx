import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/api-client';
import { useLoading } from '../context/LoadingContext';
import CredentialCard from '../components/CredentialCard';
import { colors, cardStyle, secondaryBtnStyle } from '../theme';
import type { SecurityReportResponse, CredentialListResponse } from '../types';
import { AuthExpiredError } from '../types';

type TabKey = 'weak' | 'duplicate' | 'expired';

interface TabDef {
  key: TabKey;
  label: string;
  apiPath: string;
}

const TABS: TabDef[] = [
  { key: 'weak', label: '弱密码', apiPath: '/security-report/weak' },
  { key: 'duplicate', label: '重复密码', apiPath: '/security-report/duplicate' },
  { key: 'expired', label: '超期未更新', apiPath: '/security-report/expired' },
];

const SecurityReportPage: React.FC = () => {
  const navigate = useNavigate();
  const { showLoading, hideLoading } = useLoading();

  const [report, setReport] = useState<SecurityReportResponse | null>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('weak');
  const [tabCredentials, setTabCredentials] = useState<CredentialListResponse[]>([]);
  const [tabError, setTabError] = useState('');

  const fetchReport = useCallback(async () => {
    showLoading();
    setError('');
    try {
      const data = await apiClient.get<SecurityReportResponse>('/security-report');
      setReport(data);
    } catch (err: unknown) {
      if (err instanceof AuthExpiredError) return;
      setError(err instanceof Error ? err.message : '获取安全报告失败');
    } finally {
      hideLoading();
    }
  }, [showLoading, hideLoading]);

  const fetchTabData = useCallback(async (tab: TabKey) => {
    const tabDef = TABS.find((t) => t.key === tab)!;
    showLoading();
    setTabError('');
    try {
      const data = await apiClient.get<CredentialListResponse[]>(tabDef.apiPath);
      setTabCredentials(data);
    } catch (err: unknown) {
      if (err instanceof AuthExpiredError) return;
      setTabError(err instanceof Error ? err.message : '获取凭证列表失败');
    } finally {
      hideLoading();
    }
  }, [showLoading, hideLoading]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  useEffect(() => {
    if (report) {
      fetchTabData(activeTab);
    }
  }, [activeTab, report, fetchTabData]);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
  };

  if (error) {
    return (
      <div>
        <h1 style={{ fontSize: 22, margin: '0 0 16px', color: colors.textPrimary }}>安全报告</h1>
        <div style={{ textAlign: 'center', padding: 32, ...cardStyle }}>
          <p role="alert" style={{ color: colors.danger, fontSize: 14, marginBottom: 12 }}>{error}</p>
          <button type="button" onClick={fetchReport} style={secondaryBtnStyle}>重试</button>
        </div>
      </div>
    );
  }

  if (!report) return null;

  const statsCards: { label: string; value: number; warn?: boolean }[] = [
    { label: '总凭证数', value: report.totalCredentials },
    { label: '弱密码', value: report.weakPasswordCount, warn: true },
    { label: '重复密码', value: report.duplicatePasswordCount, warn: true },
    { label: '超期未更新', value: report.expiredPasswordCount, warn: true },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 22, margin: '0 0 16px', color: colors.textPrimary }}>安全报告</h1>

      {/* Stats overview cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        {statsCards.map((card) => (
          <div key={card.label} style={{ ...cardStyle, textAlign: 'center' }}>
            <div style={{
              fontSize: 28,
              fontWeight: 700,
              color: card.warn && card.value > 0 ? colors.warning : colors.textPrimary,
              marginBottom: 4,
            }}>
              {card.value}
            </div>
            <div style={{ fontSize: 13, color: colors.textSecondary }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `2px solid ${colors.borderLight}`, marginBottom: 16 }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
              style={{
                padding: '10px 20px',
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? colors.accent : colors.textSecondary,
                background: 'none',
                border: 'none',
                borderBottom: isActive ? `2px solid ${colors.accent}` : '2px solid transparent',
                cursor: 'pointer',
                marginBottom: -2,
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tabError && (
        <div style={{ textAlign: 'center', padding: 32, ...cardStyle }}>
          <p role="alert" style={{ color: colors.danger, fontSize: 14, marginBottom: 12 }}>{tabError}</p>
          <button type="button" onClick={() => fetchTabData(activeTab)} style={secondaryBtnStyle}>重试</button>
        </div>
      )}

      {!tabError && tabCredentials.length === 0 && (
        <div style={{ textAlign: 'center', padding: 48, ...cardStyle }}>
          <p style={{ fontSize: 32, margin: '0 0 8px' }}>✅</p>
          <p style={{ color: colors.textSecondary, fontSize: 15, margin: 0 }}>
            暂无{TABS.find((t) => t.key === activeTab)!.label}凭证
          </p>
        </div>
      )}

      {!tabError && tabCredentials.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {tabCredentials.map((cred) => (
            <CredentialCard key={cred.id} credential={cred} onClick={(id) => navigate(`/vault/${id}`)} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SecurityReportPage;
