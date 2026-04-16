import React from 'react';
import { useLoading } from '../context/LoadingContext';

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(255,255,255,0.7)',
  zIndex: 9999,
};

const spinnerStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  border: '4px solid #e2e6ed',
  borderTopColor: '#1a73e8',
  borderRadius: '50%',
  animation: 'kiro-spin 0.8s linear infinite',
};

const LoadingSpinner: React.FC = () => {
  const { isLoading } = useLoading();
  if (!isLoading) return null;

  return (
    <div style={overlayStyle} role="status" aria-label="加载中">
      <style>{`@keyframes kiro-spin { to { transform: rotate(360deg); } }`}</style>
      <div style={spinnerStyle} />
    </div>
  );
};

export default LoadingSpinner;
