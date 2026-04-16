import React from 'react';
import { colors } from '../theme';
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
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(credential.id); }
      }}
      aria-label={`凭证: ${credential.accountName}`}
      style={{
        padding: 16,
        border: `1px solid ${colors.border}`,
        borderRadius: 10,
        cursor: 'pointer',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        backgroundColor: colors.cardBg,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = colors.accent;
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(26,115,232,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = colors.border;
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, color: colors.textPrimary }}>{credential.accountName}</div>
      <div style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 2 }}>{credential.username}</div>
      {credential.url && (
        <div style={{ fontSize: 12, color: colors.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {credential.url}
        </div>
      )}
      {credential.tags && (
        <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
          {credential.tags.split(',').map((tag) => (
            <span key={tag} style={{ padding: '2px 8px', fontSize: 11, backgroundColor: colors.tagBg, color: colors.tagText, borderRadius: 10 }}>
              {tag.trim()}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default CredentialCard;
