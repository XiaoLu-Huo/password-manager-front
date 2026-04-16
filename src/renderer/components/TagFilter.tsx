import React from 'react';

export interface TagFilterProps {
  tags: string[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
}

const TagFilter: React.FC<TagFilterProps> = ({ tags, selectedTag, onSelectTag }) => {
  if (tags.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }} role="group" aria-label="标签筛选">
      <button
        type="button"
        onClick={() => onSelectTag(null)}
        style={{
          padding: '4px 12px',
          fontSize: 13,
          border: '1px solid #dadce0',
          borderRadius: 16,
          cursor: 'pointer',
          backgroundColor: selectedTag === null ? '#1a73e8' : '#fff',
          color: selectedTag === null ? '#fff' : '#333',
        }}
      >
        全部
      </button>
      {tags.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => onSelectTag(tag === selectedTag ? null : tag)}
          style={{
            padding: '4px 12px',
            fontSize: 13,
            border: '1px solid #dadce0',
            borderRadius: 16,
            cursor: 'pointer',
            backgroundColor: tag === selectedTag ? '#1a73e8' : '#fff',
            color: tag === selectedTag ? '#fff' : '#333',
          }}
        >
          {tag}
        </button>
      ))}
    </div>
  );
};

export default TagFilter;
