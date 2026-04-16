import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/api-client';
import { useLoading } from '../context/LoadingContext';
import SearchBar from '../components/SearchBar';
import TagFilter from '../components/TagFilter';
import CredentialCard from '../components/CredentialCard';
import { colors, primaryBtnStyle, secondaryBtnStyle } from '../theme';
import type { CredentialListResponse } from '../types';
import { AuthExpiredError } from '../types';

const VaultPage: React.FC = () => {
  const navigate = useNavigate();
  const { showLoading, hideLoading } = useLoading();

  const [credentials, setCredentials] = useState<CredentialListResponse[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchCredentials = useCallback(async (keyword?: string, tag?: string | null) => {
    showLoading();
    setError('');
    try {
      let path: string;
      if (keyword) {
        // Backend has a dedicated search endpoint
        path = `/credentials/search?keyword=${encodeURIComponent(keyword)}`;
      } else if (tag) {
        path = `/credentials?tag=${encodeURIComponent(tag)}`;
      } else {
        path = '/credentials';
      }

      const data = await apiClient.get<CredentialListResponse[]>(path);
      setCredentials(data);

      if (!keyword && !tag) {
        const tags = new Set<string>();
        data.forEach((c) => {
          if (c.tags) c.tags.split(',').forEach((t) => tags.add(t.trim()));
        });
        setAllTags(Array.from(tags).sort());
      }
    } catch (err: unknown) {
      // AuthExpiredError is handled by the global 401 interceptor (auto-lock + redirect)
      // so we only show retry for genuine network/server errors
      if (err instanceof AuthExpiredError) return;
      setError(err instanceof Error ? err.message : '获取凭证列表失败');
    } finally {
      hideLoading();
    }
  }, [showLoading, hideLoading]);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  const handleSearch = (keyword: string) => {
    fetchCredentials(keyword, selectedTag);
  };

  const handleTagSelect = (tag: string | null) => {
    setSelectedTag(tag);
    fetchCredentials(undefined, tag);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, margin: 0, color: colors.textPrimary }}>密码库</h1>
        <button type="button" onClick={() => navigate('/vault/new')} style={primaryBtnStyle}>
          + 新建凭证
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
        <SearchBar onSearch={handleSearch} />
        <TagFilter tags={allTags} selectedTag={selectedTag} onSelectTag={handleTagSelect} />
      </div>

      {error && (
        <div style={{ textAlign: 'center', padding: 32, backgroundColor: colors.cardBg, borderRadius: 12, border: `1px solid ${colors.border}` }}>
          <p role="alert" style={{ color: colors.danger, fontSize: 14, marginBottom: 12 }}>{error}</p>
          <button type="button" onClick={() => fetchCredentials()} style={secondaryBtnStyle}>重试</button>
        </div>
      )}

      {!error && credentials.length === 0 && (
        <div style={{ textAlign: 'center', padding: 48, backgroundColor: colors.cardBg, borderRadius: 12, border: `1px solid ${colors.border}` }}>
          <p style={{ fontSize: 32, margin: '0 0 8px' }}>🔑</p>
          <p style={{ color: colors.textSecondary, fontSize: 15, margin: '0 0 16px' }}>暂无凭证</p>
          <button type="button" onClick={() => navigate('/vault/new')} style={primaryBtnStyle}>创建第一个凭证</button>
        </div>
      )}

      {!error && credentials.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {credentials.map((cred) => (
            <CredentialCard key={cred.id} credential={cred} onClick={(id) => navigate(`/vault/${id}`)} />
          ))}
        </div>
      )}
    </div>
  );
};

export default VaultPage;
