import { useState, useEffect } from 'react';

export interface ToastConfig {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
}

export const Toast = () => {
  const [toast, setToast] = useState<ToastConfig | null>(null);

  useEffect(() => {
    if (toast?.duration !== 0) {
      const timer = setTimeout(() => setToast(null), toast?.duration ?? 3000);
      return () => {
        clearTimeout(timer);
      };
    }
    return undefined;
  }, [toast]);

  // Expose toast function to window
  useEffect(() => {
    window.showToast = (config: ToastConfig) => {
      setToast({ type: 'info', duration: 3000, ...config });
    };
    return () => {
      delete window.showToast;
    };
  }, []);

  if (!toast) return null;

  const bgColors: Record<'success' | 'error' | 'info', string> = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <div
        className={`${bgColors[toast.type ?? 'info']} text-[#e0e0e0] px-6 py-3 rounded shadow-lg transition-all`}
      >
        {toast.message}
      </div>
    </div>
  );
};

// Global toast function
declare global {
  interface Window {
    showToast?: (config: ToastConfig) => void;
  }
}
