import { useState, useEffect } from 'react';
import { onToast, ToastType } from '../toast';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

const config: Record<ToastType, { icon: string; bg: string; border: string }> = {
  success: { icon: '✅', bg: '#f0fdf4', border: '#22c55e' },
  error: { icon: '❌', bg: '#fef2f2', border: '#ef4444' },
  warning: { icon: '⚠️', bg: '#fffbeb', border: '#f59e0b' },
  info: { icon: 'ℹ️', bg: '#eff6ff', border: '#3b82f6' },
};

export default function Toast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    return onToast((toast) => {
      const id = toast.id;
      setToasts(prev => [...prev, toast]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 4000);
    });
  }, []);

  return (
    <div style={{
      position: 'fixed', top: 20, right: 20, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      {toasts.map(t => {
        const cfg = config[t.type];
        return (
          <div key={t.id} style={{
            background: cfg.bg,
            border: `1.5px solid ${cfg.border}`,
            borderRadius: 12,
            padding: '14px 20px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            display: 'flex', alignItems: 'center', gap: 12,
            fontSize: 14, lineHeight: 1.5,
            minWidth: 300, maxWidth: 440,
            color: '#1f2937',
            animation: 'toastSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>{cfg.icon}</span>
            <span style={{ flex: 1 }}>{t.message}</span>
          </div>
        );
      })}
      <style>{`
        @keyframes toastSlideIn {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
