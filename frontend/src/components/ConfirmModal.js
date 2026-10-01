import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  title = 'Konfirmasi',
  message,
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  onConfirm,
  onCancel,
  isDanger = false,
  loading = false
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isDanger && <AlertTriangle size={20} color="var(--danger)" />}
            <span>{title}</span>
          </div>
          <button
            type="button"
            onClick={onCancel}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: '14px', lineHeight: 1.6 }}>{message}</p>
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Memproses...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
