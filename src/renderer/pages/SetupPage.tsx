import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/api-client';
import { useLoading } from '../context/LoadingContext';
import PasswordInput from '../components/PasswordInput';
import type { CreateMasterPasswordRequest } from '../types/auth';

const SetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { showLoading, hideLoading } = useLoading();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [apiError, setApiError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    setConfirmError('');

    if (password !== confirmPassword) {
      setConfirmError('两次输入的密码不一致');
      return;
    }

    showLoading();
    try {
      const body: CreateMasterPasswordRequest = { masterPassword: password };
      await apiClient.post<void>('/auth/setup', body);
      navigate('/unlock', { replace: true });
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : '设置主密码失败');
    } finally {
      hideLoading();
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 24,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          maxWidth: 400,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <h1 style={{ fontSize: 24, margin: 0, textAlign: 'center' }}>设置主密码</h1>

        {apiError && (
          <p role="alert" style={{ color: '#d93025', fontSize: 13, margin: 0, textAlign: 'center' }}>
            {apiError}
          </p>
        )}

        <PasswordInput
          value={password}
          onChange={setPassword}
          placeholder="输入主密码"
        />

        <PasswordInput
          value={confirmPassword}
          onChange={(v) => {
            setConfirmPassword(v);
            if (confirmError) setConfirmError('');
          }}
          placeholder="确认主密码"
          error={confirmError}
        />

        <button
          type="submit"
          style={{
            padding: '10px 0',
            fontSize: 15,
            fontWeight: 600,
            color: '#fff',
            backgroundColor: '#1a73e8',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          创建主密码
        </button>
      </form>
    </div>
  );
};

export default SetupPage;
