import React from 'react';
import { colors } from '../theme';

export interface TagFilterProps {
  tags: string[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
}

const TagFilter: React.FC<TagFilterProps> = ({ tags, selectedTag, onSelectTag }) => {
  if (tags.length === 0) return null;

  const chipStyle = (active: boolean): React.CSSProperties => ({
    padding: '5px 14px',
    fontSize: 13,
    border: `1px solid ${active ? colors.accent : colors.border}`,
    borderRadius: 16,
    cursor: 'pointer',
    backgroundColor: active ? colors.accent : colors.cardBg,
    color: active ? '#fff' : colors.textSecondary,
    transition: 'all 0.15s',
  });

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }} role="group" aria-label="标签筛选">
      <button type="button" onClick={() => onSelectTag(null)} style={chipStyle(selectedTag === null)}>全部</button>
      {tags.map((tag) => (
        <button key={tag} type="button" onClick={() => onSelectTag(tag === selectedTag ? null : tag)} style={chipStyle(tag === selectedTag)}>
          {tag}
        </button>
      ))}
    </div>
  );
};

export default TagFilter;
