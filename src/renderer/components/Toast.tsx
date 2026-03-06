import { useEffect } from 'react';
import {
  Toast as FluentToast,
  ToastIntent,
  ToastTitle,
  Toaster,
  useToastController,
} from '@fluentui/react-components';

export interface ToastConfig {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
}

export const Toast = () => {
  const toasterId = 'media-manager-toaster';
  const { dispatchToast } = useToastController(toasterId);

  // Expose toast function to window
  useEffect(() => {
    window.showToast = (config: ToastConfig) => {
      const nextType = config.type ?? 'info';
      const intent = toastIntentMap[nextType];
      const timeout = config.duration === 0 ? 86_400_000 : (config.duration ?? 3000);

      dispatchToast(
        <FluentToast>
          <ToastTitle>{config.message}</ToastTitle>
        </FluentToast>,
        { intent, timeout }
      );
    };

    return () => {
      delete window.showToast;
    };
  }, [dispatchToast]);

  return <Toaster toasterId={toasterId} position="top-end" />;
};

const toastIntentMap: Record<'success' | 'error' | 'info', ToastIntent> = {
  success: 'success',
  error: 'error',
  info: 'info',
};

// Global toast function
declare global {
  interface Window {
    showToast?: (config: ToastConfig) => void;
  }
}
