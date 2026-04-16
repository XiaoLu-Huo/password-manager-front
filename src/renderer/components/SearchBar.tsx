import React, { useState } from 'react';
import { inputStyle as baseInputStyle, primaryBtnStyle } from '../theme';

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
    if (value === '') onSearch('');
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
      <input
        type="search"
        value={keyword}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label={placeholder}
        style={{ ...baseInputStyle, flex: 1 }}
      />
      <button type="submit" style={{ ...primaryBtnStyle, whiteSpace: 'nowrap' }}>搜索</button>
    </form>
  );
};

export default SearchBar;
