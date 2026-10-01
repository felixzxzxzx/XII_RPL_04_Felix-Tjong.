'use client';

import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, X } from 'lucide-react';

export default function FlashAlert({ type = 'success', message, onClose, duration = 5000 }) {
  useEffect(() => {
    if (!message || !duration) return;
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const alertClass = {
    success: 'flash-alert-success',
    danger: 'flash-alert-danger',
    error: 'flash-alert-danger',
    warning: 'flash-alert-warning'
  }[type] || 'flash-alert-success';

  const Icon = {
    success: CheckCircle2,
    danger: AlertCircle,
    error: AlertCircle,
    warning: AlertTriangle
  }[type] || CheckCircle2;

  return (
    <div className={`flash-alert ${alertClass}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Icon size={18} />
        <span>{message}</span>
      </div>
      {onClose && (
        <button type="button" onClick={onClose} className="flash-close-btn" aria-label="Tutup">
          <X size={16} />
        </button>
      )}
    </div>
  );
}
