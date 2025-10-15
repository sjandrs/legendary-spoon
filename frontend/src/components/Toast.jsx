import React from 'react';

export default function Toast({ message, type = 'info', onClose, 'data-testid': dataTestId }) {
  if (!message) return null;
  const bg = type === 'error' ? '#fdecea' : type === 'success' ? '#edf7ed' : '#e8f4fd';
  const color = type === 'error' ? '#b71c1c' : type === 'success' ? '#1b5e20' : '#0d47a1';
  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      aria-live="polite"
      style={{ position: 'fixed', bottom: 16, right: 16, background: bg, color, padding: '10px 14px', borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
      data-testid={dataTestId}
    >
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} style={{ marginLeft: 12 }} aria-label="Close notification">×</button>
      )}
    </div>
  );
}
