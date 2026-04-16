import React, { useState, useRef } from 'react';
import { apiClient } from '../api/api-client';
import { useLoading } from '../context/LoadingContext';
import { ConflictStrategy, AuthExpiredError } from '../types';
import type { ImportResultResponse } from '../types';
import {
  colors,
  cardStyle,
  inputStyle,
  labelStyle,
  primaryBtnStyle,
  secondaryBtnStyle,
  errorStyle,
} from '../theme';

const CONFLICT_OPTIONS: { value: ConflictStrategy; label: string; desc: string }[] = [
  { value: ConflictStrategy.OVERWRITE, label: '覆盖', desc: '用导入数据覆盖已有凭证' },
  { value: ConflictStrategy.SKIP, label: '跳过', desc: '保留已有凭证，跳过冲突项' },
  { value: ConflictStrategy.KEEP_BOTH, label: '保留两者', desc: '同时保留已有和导入的凭证' },
];

const ImportExportPage: React.FC = () => {
  const { showLoading, hideLoading } = useLoading();

  // ---- Export state ----
  const [exportPassword, setExportPassword] = useState('');
  const [exportError, setExportError] = useState('');
  const [exportSuccess, setExportSuccess] = useState('');

  // ---- Import state ----
  const [importFile, setImportFile] = useState<File | null>(null);
  const [filePassword, setFilePassword] = useState('');
  const [conflictStrategy, setConflictStrategy] = useState<ConflictStrategy>(ConflictStrategy.SKIP);
  const [importError, setImportError] = useState('');
  const [importResult, setImportResult] = useState<ImportResultResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---- Export handler ----
  const handleExport = async () => {
    setExportError('');
    setExportSuccess('');

    if (!exportPassword.trim()) {
      setExportError('请输入加密密码');
      return;
    }

    showLoading();
    try {
      const token = apiClient.getSessionToken();
      const response = await fetch('/api/import-export/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ encryptionPassword: exportPassword }),
      });

      if (response.status === 401) {
        throw new AuthExpiredError('会话已过期，请重新解锁');
      }

      if (!response.ok) {
        // Try to parse error body
        let msg = '导出失败';
        try {
          const errBody = await response.json();
          if (errBody?.message) msg = errBody.message;
        } catch { /* ignore parse error */ }
        throw new Error(msg);
      }

      const blob = await response.blob();

      // Extract filename from Content-Disposition header
      const disposition = response.headers.get('Content-Disposition') || '';
      const filenameMatch = disposition.match(/filename="?([^";\n]+)"?/);
      const filename = filenameMatch?.[1] || 'vault_export.xlsx';

      // Download via Blob URL + anchor element
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportSuccess('导出成功！文件已开始下载。');
      setExportPassword('');
    } catch (err: unknown) {
      if (err instanceof AuthExpiredError) return;
      setExportError(err instanceof Error ? err.message : '导出失败');
    } finally {
      hideLoading();
    }
  };

  // ---- Import handlers ----
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImportFile(file);
    setImportError('');
    setImportResult(null);
  };

  const handleImport = async () => {
    setImportError('');
    setImportResult(null);

    if (!importFile) {
      setImportError('请选择要导入的 Excel 文件');
      return;
    }

    if (!filePassword.trim()) {
      setImportError('请输入文件密码');
      return;
    }

    showLoading();
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('filePassword', filePassword);
      formData.append('conflictStrategy', conflictStrategy);

      const result = await apiClient.postForm<ImportResultResponse>(
        '/import-export/import',
        formData,
      );
      setImportResult(result);
      setImportFile(null);
      setFilePassword('');
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: unknown) {
      if (err instanceof AuthExpiredError) return;
      setImportError(err instanceof Error ? err.message : '导入失败');
    } finally {
      hideLoading();
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: 22, margin: '0 0 24px', color: colors.textPrimary }}>导入 / 导出</h1>

      {/* ---- Export Section ---- */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <h2 style={{ fontSize: 17, margin: '0 0 16px', color: colors.textPrimary }}>导出数据</h2>
        <p style={{ fontSize: 13, color: colors.textSecondary, margin: '0 0 16px' }}>
          将密码库导出为加密的 Excel 文件。请设置一个加密密码来保护导出文件。
        </p>

        <div style={{ marginBottom: 12 }}>
          <label htmlFor="export-password" style={labelStyle}>加密密码</label>
          <input
            id="export-password"
            type="password"
            value={exportPassword}
            onChange={(e) => setExportPassword(e.target.value)}
            placeholder="设置导出文件的加密密码"
            style={inputStyle}
          />
        </div>

        {exportError && <p role="alert" style={{ ...errorStyle, marginBottom: 12 }}>{exportError}</p>}
        {exportSuccess && (
          <p style={{ color: colors.success, fontSize: 12, margin: '0 0 12px' }}>{exportSuccess}</p>
        )}

        <button type="button" onClick={handleExport} style={primaryBtnStyle}>
          导出加密 Excel
        </button>
      </div>

      {/* ---- Import Section ---- */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: 17, margin: '0 0 16px', color: colors.textPrimary }}>导入数据</h2>
        <p style={{ fontSize: 13, color: colors.textSecondary, margin: '0 0 16px' }}>
          从加密的 Excel 文件导入凭证数据。请选择文件并输入文件密码。
        </p>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          data-testid="file-input"
        />

        {/* File selection area */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>选择文件</label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 14px',
              backgroundColor: colors.inputBg,
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
            }}
          >
            <button type="button" onClick={handleFileSelect} style={secondaryBtnStyle}>
              选择 Excel 文件
            </button>
            <span style={{ fontSize: 13, color: importFile ? colors.textPrimary : colors.textMuted }}>
              {importFile ? importFile.name : '未选择文件'}
            </span>
          </div>
        </div>

        {/* File password */}
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="file-password" style={labelStyle}>文件密码</label>
          <input
            id="file-password"
            type="password"
            value={filePassword}
            onChange={(e) => setFilePassword(e.target.value)}
            placeholder="输入导出时设置的加密密码"
            style={inputStyle}
          />
        </div>

        {/* Conflict strategy */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>冲突策略</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {CONFLICT_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  cursor: 'pointer',
                  padding: '8px 12px',
                  borderRadius: 8,
                  backgroundColor:
                    conflictStrategy === opt.value ? colors.accentSubtle : 'transparent',
                  border: `1px solid ${
                    conflictStrategy === opt.value ? colors.accent : colors.borderLight
                  }`,
                }}
              >
                <input
                  type="radio"
                  name="conflictStrategy"
                  value={opt.value}
                  checked={conflictStrategy === opt.value}
                  onChange={() => setConflictStrategy(opt.value)}
                  style={{ marginTop: 2 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: colors.textPrimary }}>
                    {opt.label}
                  </div>
                  <div style={{ fontSize: 12, color: colors.textSecondary }}>{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {importError && <p role="alert" style={{ ...errorStyle, marginBottom: 12 }}>{importError}</p>}

        {/* Import result summary */}
        {importResult && (
          <div
            style={{
              padding: 16,
              borderRadius: 8,
              backgroundColor: colors.accentSubtle,
              border: `1px solid ${colors.accent}`,
              marginBottom: 16,
            }}
          >
            <h3 style={{ fontSize: 15, margin: '0 0 12px', color: colors.textPrimary }}>
              导入完成
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              <div style={{ fontSize: 13, color: colors.textSecondary }}>
                总记录数：<strong style={{ color: colors.textPrimary }}>{importResult.totalCount}</strong>
              </div>
              <div style={{ fontSize: 13, color: colors.textSecondary }}>
                成功导入：<strong style={{ color: colors.success }}>{importResult.importedCount}</strong>
              </div>
              <div style={{ fontSize: 13, color: colors.textSecondary }}>
                已跳过：<strong style={{ color: colors.warning }}>{importResult.skippedCount}</strong>
              </div>
              <div style={{ fontSize: 13, color: colors.textSecondary }}>
                已覆盖：<strong style={{ color: colors.accent }}>{importResult.overwrittenCount}</strong>
              </div>
            </div>
          </div>
        )}

        <button type="button" onClick={handleImport} style={primaryBtnStyle}>
          开始导入
        </button>
      </div>
    </div>
  );
};

export default ImportExportPage;
