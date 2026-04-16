import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/api-client';
import { useLoading } from '../context/LoadingContext';
import { PasswordStrengthLevel } from '../types/api';
import type { GeneratePasswordRequest, GeneratedPasswordResponse, PasswordRuleResponse } from '../types/password-generator';
import StrengthIndicator from '../components/StrengthIndicator';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  colors, cardStyle, inputStyle, labelStyle,
  primaryBtnStyle, secondaryBtnStyle, dangerBtnStyle, errorStyle,
} from '../theme';

const DEFAULT_LENGTH = 16;

const PasswordGeneratorPage: React.FC = () => {
  const { showLoading, hideLoading } = useLoading();

  // Mode: true = use default rules, false = custom
  const [useDefault, setUseDefault] = useState(true);

  // Custom rule params
  const [length, setLength] = useState(DEFAULT_LENGTH);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeDigits, setIncludeDigits] = useState(true);
  const [includeSpecial, setIncludeSpecial] = useState(true);

  // Generated result
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [strengthLevel, setStrengthLevel] = useState<PasswordStrengthLevel | null>(null);
  const [copied, setCopied] = useState(false);

  // Saved rules
  const [rules, setRules] = useState<PasswordRuleResponse[]>([]);
  const [ruleName, setRuleName] = useState('');

  // Edit state
  const [editingRuleId, setEditingRuleId] = useState<number | null>(null);
  const [editRuleName, setEditRuleName] = useState('');

  // Delete confirm
  const [deleteRuleId, setDeleteRuleId] = useState<number | null>(null);

  // Errors
  const [apiError, setApiError] = useState('');

  // Load saved rules on mount
  const loadRules = useCallback(async () => {
    try {
      const data = await apiClient.get<PasswordRuleResponse[]>('/password-generator/rules');
      setRules(data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadRules(); }, [loadRules]);

  // Generate password
  const handleGenerate = async () => {
    setApiError('');
    showLoading();
    try {
      const body: GeneratePasswordRequest = useDefault
        ? { useDefault: true }
        : { length, includeUppercase, includeLowercase, includeDigits, includeSpecial, useDefault: false };
      const result = await apiClient.post<GeneratedPasswordResponse>('/password-generator/generate', body);
      setGeneratedPassword(result.password);
      setStrengthLevel(result.strengthLevel);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : '生成密码失败');
    } finally { hideLoading(); }
  };

  // Copy password
  const handleCopy = async () => {
    if (!generatedPassword) return;
    try {
      if (window.electronBridge?.clipboard) {
        await window.electronBridge.clipboard.copyPassword(generatedPassword);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(generatedPassword);
      } else {
        fallbackCopy(generatedPassword);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      try {
        fallbackCopy(generatedPassword);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch { /* ignore */ }
    }
  };

  // Save current config as a rule
  const handleSaveRule = async () => {
    if (!ruleName.trim()) return;
    setApiError('');
    showLoading();
    try {
      await apiClient.post<PasswordRuleResponse>('/password-generator/rules', {
        ruleName: ruleName.trim(),
        length, includeUppercase, includeLowercase, includeDigits, includeSpecial,
      });
      setRuleName('');
      await loadRules();
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : '保存规则失败');
    } finally { hideLoading(); }
  };

  // Select a saved rule → fill form and generate
  const handleSelectRule = async (rule: PasswordRuleResponse) => {
    setUseDefault(false);
    setLength(rule.length);
    setIncludeUppercase(rule.includeUppercase);
    setIncludeLowercase(rule.includeLowercase);
    setIncludeDigits(rule.includeDigits);
    setIncludeSpecial(rule.includeSpecial);
    setApiError('');
    showLoading();
    try {
      const body: GeneratePasswordRequest = {
        length: rule.length, includeUppercase: rule.includeUppercase,
        includeLowercase: rule.includeLowercase, includeDigits: rule.includeDigits,
        includeSpecial: rule.includeSpecial, useDefault: false,
      };
      const result = await apiClient.post<GeneratedPasswordResponse>('/password-generator/generate', body);
      setGeneratedPassword(result.password);
      setStrengthLevel(result.strengthLevel);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : '生成密码失败');
    } finally { hideLoading(); }
  };

  // Start editing a rule
  const handleStartEdit = (rule: PasswordRuleResponse) => {
    setEditingRuleId(rule.id);
    setEditRuleName(rule.ruleName);
  };

  // Save edited rule (update name + current form params)
  const handleUpdateRule = async () => {
    if (editingRuleId === null || !editRuleName.trim()) return;
    setApiError('');
    showLoading();
    try {
      await apiClient.put<PasswordRuleResponse>(`/password-generator/rules/${editingRuleId}`, {
        ruleName: editRuleName.trim(),
        length, includeUppercase, includeLowercase, includeDigits, includeSpecial,
      });
      setEditingRuleId(null);
      setEditRuleName('');
      await loadRules();
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : '更新规则失败');
    } finally { hideLoading(); }
  };

  // Delete a rule
  const handleDeleteRule = async () => {
    if (deleteRuleId === null) return;
    setApiError('');
    showLoading();
    try {
      await apiClient.delete(`/password-generator/rules/${deleteRuleId}`);
      setDeleteRuleId(null);
      await loadRules();
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : '删除规则失败');
    } finally { hideLoading(); }
  };

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <h1 style={{ fontSize: 20, margin: '0 0 20px', color: colors.textPrimary }}>密码生成器</h1>

      {apiError && (
        <p role="alert" style={{ color: colors.danger, fontSize: 13, margin: '0 0 12px', padding: '8px 12px', backgroundColor: colors.dangerBg, borderRadius: 6 }}>{apiError}</p>
      )}

      {/* Mode toggle */}
      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <ModeButton active={useDefault} onClick={() => setUseDefault(true)} label="默认规则" />
          <ModeButton active={!useDefault} onClick={() => setUseDefault(false)} label="自定义规则" />
        </div>

        {!useDefault && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>密码长度: {length}</label>
              <input type="range" min={8} max={128} value={length}
                onChange={(e) => setLength(Number(e.target.value))}
                style={{ width: '100%', accentColor: colors.accent }} aria-label="密码长度" />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: colors.textMuted }}>
                <span>8</span><span>128</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <Toggle checked={includeUppercase} onChange={setIncludeUppercase} label="大写字母 (A-Z)" />
              <Toggle checked={includeLowercase} onChange={setIncludeLowercase} label="小写字母 (a-z)" />
              <Toggle checked={includeDigits} onChange={setIncludeDigits} label="数字 (0-9)" />
              <Toggle checked={includeSpecial} onChange={setIncludeSpecial} label="特殊字符 (!@#)" />
            </div>
          </div>
        )}

        <button type="button" onClick={handleGenerate} style={{ ...primaryBtnStyle, width: '100%', padding: '12px 0', fontSize: 15 }}>
          🔄 生成密码
        </button>
      </div>

      {/* Generated result */}
      {generatedPassword && (
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <label style={labelStyle}>生成结果</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <code style={{
              flex: 1, padding: '10px 14px', fontSize: 15, fontFamily: 'monospace',
              backgroundColor: colors.inputBg, border: `1px solid ${colors.border}`,
              borderRadius: 8, wordBreak: 'break-all',
            }}>
              {generatedPassword}
            </code>
            <button type="button" onClick={handleCopy} style={{ ...secondaryBtnStyle, whiteSpace: 'nowrap' }}>
              {copied ? '已复制 ✓' : '📋 复制'}
            </button>
          </div>
          {strengthLevel && <StrengthIndicator level={strengthLevel} />}
        </div>
      )}

      {/* Save rule (only in custom mode) */}
      {!useDefault && (
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <label style={labelStyle}>保存当前规则</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="text" value={ruleName} onChange={(e) => setRuleName(e.target.value)}
              placeholder="输入规则名称" style={{ ...inputStyle, flex: 1 }} />
            <button type="button" onClick={handleSaveRule} disabled={!ruleName.trim()}
              style={{ ...primaryBtnStyle, opacity: ruleName.trim() ? 1 : 0.5, whiteSpace: 'nowrap' }}>
              💾 保存
            </button>
          </div>
        </div>
      )}

      {/* Saved rules list */}
      {rules.length > 0 && (
        <div style={cardStyle}>
          <label style={labelStyle}>已保存规则（点击可快速生成密码）</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rules.map((rule) => (
              <div key={rule.id} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', fontSize: 14,
                backgroundColor: colors.inputBg, border: `1px solid ${colors.border}`,
                borderRadius: 8,
              }}>
                {editingRuleId === rule.id ? (
                  /* Inline edit mode */
                  <>
                    <input type="text" value={editRuleName}
                      onChange={(e) => setEditRuleName(e.target.value)}
                      style={{ ...inputStyle, flex: 1, padding: '6px 10px', fontSize: 13 }}
                      autoFocus />
                    <button type="button" onClick={handleUpdateRule}
                      disabled={!editRuleName.trim()}
                      style={{ ...smallBtnStyle, color: colors.accent, opacity: editRuleName.trim() ? 1 : 0.5 }}>
                      保存
                    </button>
                    <button type="button" onClick={() => setEditingRuleId(null)}
                      style={smallBtnStyle}>
                      取消
                    </button>
                  </>
                ) : (
                  /* Normal display mode */
                  <>
                    <button type="button" onClick={() => handleSelectRule(rule)}
                      style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
                      <span style={{ fontWeight: 500, color: colors.textPrimary }}>{rule.ruleName}</span>
                      <span style={{ fontSize: 12, color: colors.textMuted }}>
                        {rule.length} 位 · {formatRuleCharTypes(rule)}
                      </span>
                    </button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); handleStartEdit(rule); }}
                      style={smallBtnStyle} aria-label={`编辑规则 ${rule.ruleName}`}>
                      ✏️
                    </button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setDeleteRuleId(rule.id); }}
                      style={{ ...smallBtnStyle, color: colors.danger }} aria-label={`删除规则 ${rule.ruleName}`}>
                      🗑️
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteRuleId !== null}
        title="删除规则"
        message={`确定要删除规则「${rules.find((r) => r.id === deleteRuleId)?.ruleName || ''}」吗？`}
        confirmLabel="删除"
        onConfirm={handleDeleteRule}
        onCancel={() => setDeleteRuleId(null)}
      />
    </div>
  );
};

// ---- Helpers ----

const fallbackCopy = (text: string) => {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
};

const formatRuleCharTypes = (rule: PasswordRuleResponse): string => {
  const parts: string[] = [];
  if (rule.includeUppercase) parts.push('大写字母');
  if (rule.includeLowercase) parts.push('小写字母');
  if (rule.includeDigits) parts.push('数字');
  if (rule.includeSpecial) parts.push('特殊字符');
  return parts.join('、') || '无';
};

const smallBtnStyle: React.CSSProperties = {
  padding: '4px 8px', fontSize: 12, border: `1px solid ${colors.border}`,
  borderRadius: 4, backgroundColor: colors.cardBg, color: colors.textSecondary,
  cursor: 'pointer', whiteSpace: 'nowrap',
};

// ---- Sub-components ----

const ModeButton: React.FC<{ active: boolean; onClick: () => void; label: string }> = ({ active, onClick, label }) => (
  <button type="button" onClick={onClick} style={{
    flex: 1, padding: '8px 0', fontSize: 14, fontWeight: 500, borderRadius: 6, cursor: 'pointer',
    border: `1px solid ${active ? colors.accent : colors.border}`,
    backgroundColor: active ? colors.accentSubtle : 'transparent',
    color: active ? colors.accent : colors.textSecondary,
  }}>
    {label}
  </button>
);

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string }> = ({ checked, onChange, label }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: colors.textPrimary, cursor: 'pointer', minWidth: '45%' }}>
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ accentColor: colors.accent }} />
    {label}
  </label>
);

export default PasswordGeneratorPage;
