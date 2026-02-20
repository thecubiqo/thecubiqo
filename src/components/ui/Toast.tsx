// Toast Notification Component
'use client';

import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

const toastStyles = {
  success: 'bg-emerald-900 border-emerald-700 text-emerald-100',
  error: 'bg-red-900 border-red-700 text-red-100',
  info: 'bg-indigo-900 border-indigo-700 text-indigo-100',
  warning: 'bg-amber-900 border-amber-700 text-amber-100',
};

const toastIcons = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
};

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

export function Toast({ toast, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, [toast, onClose]);

  return (
    <div
      className={`${toastStyles[toast.type]} border-2 rounded-xl p-4 shadow-xl backdrop-blur-sm animate-slide-in-right flex items-start gap-3 min-w-80 max-w-md`}
      role="alert"
    >
      <span className="text-2xl mt-0.5">{toastIcons[toast.type]}</span>
      <div className="flex-1">
        <p className="font-semibold">{toast.title}</p>
        {toast.message && (
          <p className="text-sm opacity-90 mt-1">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className="text-xl opacity-50 hover:opacity-100 transition-opacity"
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onClose }: { toasts: ToastMessage[]; onClose: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}
