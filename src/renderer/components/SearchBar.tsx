import React, { useState } from 'react';

export interface SearchBarProps {
  onSearch: (keyword: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, placeholder = '搜索凭证...' }) => {
  const [keyword, setKeyword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(keyword.trim());
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setKeyword(value);
    if (value === '') {
      onSearch('');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
      <input
        type="search"
        value={keyword}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label={placeholder}
        style={{
          flex: 1,
          padding: '8px 12px',
          fontSize: 14,
          border: '1px solid #dadce0',
          borderRadius: 6,
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
      <button
        type="submit"
        style={{
          padding: '8px 16px',
          fontSize: 14,
          color: '#fff',
          backgroundColor: '#1a73e8',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
        }}
      >
        搜索
      </button>
    </form>
  );
};

export default SearchBar;
