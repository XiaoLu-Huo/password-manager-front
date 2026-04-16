import React, { useState } from 'react';

export interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  value,
  onChange,
  placeholder = '请输入密码',
  error,
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <div style={{ width: '100%' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          aria-invalid={!!error}
          aria-describedby={error ? 'password-input-error' : undefined}
          style={{
            width: '100%',
            padding: '10px 40px 10px 12px',
            fontSize: 14,
            border: `1px solid ${error ? '#d93025' : '#dadce0'}`,
            borderRadius: 6,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? '隐藏密码' : '显示密码'}
          style={{
            position: 'absolute',
            right: 8,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 18,
            padding: 4,
            lineHeight: 1,
            color: '#5f6368',
          }}
        >
          {visible ? '🙈' : '👁️'}
        </button>
      </div>
      {error && (
        <p
          id="password-input-error"
          role="alert"
          style={{ color: '#d93025', fontSize: 12, margin: '4px 0 0 0' }}
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default PasswordInput;
