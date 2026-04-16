import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/api-client';
import { useLoading } from '../context/LoadingContext';
import SearchBar from '../components/SearchBar';
import TagFilter from '../components/TagFilter';
import CredentialCard from '../components/CredentialCard';
import type { CredentialListResponse } from '../types';

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
      let path = '/credentials';
      const params = new URLSearchParams();
      if (keyword) params.set('keyword', keyword);
      if (tag) params.set('tag', tag);
      const qs = params.toString();
      if (qs) path += `?${qs}`;

      const data = await apiClient.get<CredentialListResponse[]>(path);
      setCredentials(data);

      // Extract unique tags from all credentials for the filter
      if (!keyword && !tag) {
        const tags = new Set<string>();
        data.forEach((c) => {
          if (c.tags) c.tags.split(',').forEach((t) => tags.add(t.trim()));
        });
        setAllTags(Array.from(tags).sort());
      }
    } catch (err: unknown) {
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
        <h1 style={{ fontSize: 22, margin: 0 }}>密码库</h1>
        <button
          type="button"
          onClick={() => navigate('/vault/new')}
          style={{
            padding: '8px 16px',
            fontSize: 14,
            fontWeight: 600,
            color: '#fff',
            backgroundColor: '#1a73e8',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          + 新建凭证
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
        <SearchBar onSearch={handleSearch} />
        <TagFilter tags={allTags} selectedTag={selectedTag} onSelectTag={handleTagSelect} />
      </div>

      {error && (
        <div style={{ textAlign: 'center', padding: 24 }}>
          <p role="alert" style={{ color: '#d93025', fontSize: 14, marginBottom: 12 }}>{error}</p>
          <button
            type="button"
            onClick={() => fetchCredentials()}
            style={{
              padding: '8px 16px',
              fontSize: 14,
              color: '#1a73e8',
              backgroundColor: '#fff',
              border: '1px solid #1a73e8',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            重试
          </button>
        </div>
      )}

      {!error && credentials.length === 0 && (
        <p style={{ textAlign: 'center', color: '#5f6368', padding: 24 }}>暂无凭证</p>
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
