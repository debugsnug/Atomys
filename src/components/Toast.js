'use client';

export default function Toast({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.type === 'success' ? '✓' : t.type === 'error' ? '✗' : '!'} {t.message}
        </div>
      ))}
    </div>
  );
}
