import React from 'react';
import type { CredentialListResponse } from '../types';

export interface CredentialCardProps {
  credential: CredentialListResponse;
  onClick: (id: number) => void;
}

const CredentialCard: React.FC<CredentialCardProps> = ({ credential, onClick }) => {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(credential.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(credential.id);
        }
      }}
      aria-label={`凭证: ${credential.accountName}`}
      style={{
        padding: 16,
        border: '1px solid #dadce0',
        borderRadius: 8,
        cursor: 'pointer',
        transition: 'box-shadow 0.15s',
        backgroundColor: '#fff',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{credential.accountName}</div>
      <div style={{ fontSize: 13, color: '#5f6368', marginBottom: 2 }}>{credential.username}</div>
      {credential.url && (
        <div style={{ fontSize: 12, color: '#80868b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {credential.url}
        </div>
      )}
      {credential.tags && (
        <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
          {credential.tags.split(',').map((tag) => (
            <span
              key={tag}
              style={{
                padding: '2px 8px',
                fontSize: 11,
                backgroundColor: '#e8f0fe',
                color: '#1a73e8',
                borderRadius: 10,
              }}
            >
              {tag.trim()}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default CredentialCard;
