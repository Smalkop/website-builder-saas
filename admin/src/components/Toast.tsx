import { useState, useEffect } from 'react';
import { onToast, ToastType } from '../toast';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

const icons: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

const colors: Record<ToastType, string> = {
  success: '#059669',
  error: '#dc2626',
  warning: '#d97706',
  info: '#2563eb',
};

export default function Toast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    return onToast((toast) => {
      const id = toast.id;
      setToasts(prev => [...prev, toast]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 3500);
    });
  }, []);

  return (
    <div style={{
      position: 'fixed', top: 16, right: 16, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: colors[t.type],
          color: '#fff', padding: '12px 20px', borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex', alignItems: 'center', gap: 10,
          fontSize: 14, lineHeight: 1.4, minWidth: 280, maxWidth: 420,
          animation: 'slideIn 0.3s ease',
        }}>
          <span style={{ fontSize: 16, fontWeight: 700 }}>{icons[t.type]}</span>
          <span>{t.message}</span>
        </div>
      ))}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
