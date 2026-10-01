import React from 'react';

export default function StatCard({ title, value, icon: Icon, subtitle, color = 'primary' }) {
  const colorMap = {
    primary: {
      bg: 'var(--primary-light)',
      text: 'var(--primary)'
    },
    success: {
      bg: 'var(--success-bg)',
      text: 'var(--success)'
    },
    warning: {
      bg: 'var(--warning-bg)',
      text: 'var(--warning)'
    },
    danger: {
      bg: 'var(--danger-bg)',
      text: 'var(--danger)'
    }
  };

  const selectedColor = colorMap[color] || colorMap.primary;

  return (
    <div className="card" style={{ flex: 1, minWidth: '240px' }}>
      <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {Icon && (
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: selectedColor.bg,
              color: selectedColor.text,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Icon size={26} />
          </div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>
            {title}
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', lineHeight: 1.2 }}>
            {value}
          </div>
          {subtitle && (
            <div style={{ fontSize: '12px', color: 'var(--text-subtle)', marginTop: '4px' }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
