import React from 'react';
import { colors } from '../theme';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open, title, message, confirmLabel = '确认', cancelLabel = '取消', onConfirm, onCancel,
}) => {
  if (!open) return null;

  return (
    <div
      style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.overlay, zIndex: 10000 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div style={{ backgroundColor: colors.cardBg, borderRadius: 12, padding: 24, width: '100%', maxWidth: 400, boxShadow: '0 4px 24px rgba(0,0,0,0.12)', border: `1px solid ${colors.border}` }}>
        <h2 id="confirm-dialog-title" style={{ fontSize: 18, margin: '0 0 8px', color: colors.textPrimary }}>{title}</h2>
        <p style={{ fontSize: 14, color: colors.textSecondary, margin: '0 0 20px' }}>{message}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            type="button"
            onClick={onCancel}
            style={{ padding: '8px 16px', fontSize: 14, border: `1px solid ${colors.border}`, borderRadius: 8, backgroundColor: colors.cardBg, color: colors.textPrimary, cursor: 'pointer' }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{ padding: '8px 16px', fontSize: 14, color: '#fff', backgroundColor: colors.danger, border: 'none', borderRadius: 8, cursor: 'pointer' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
