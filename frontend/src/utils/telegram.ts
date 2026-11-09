// Telegram WebApp bridge & Haptic Feedback wrapper

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            photo_url?: string;
          };
          start_param?: string;
        };
        expand: () => void;
        close: () => void;
        ready: () => void;
        HapticFeedback?: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        openTelegramLink: (url: string) => void;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
      };
    };
  }
}

export const isTelegramWebApp = (): boolean => {
  return typeof window !== 'undefined' && Boolean(window.Telegram?.WebApp?.initData);
};

export const getTelegramWebApp = () => {
  if (typeof window !== 'undefined') {
    return window.Telegram?.WebApp;
  }
  return undefined;
};

export const haptic = {
  impact: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') => {
    try {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(style);
      if (!isTelegramWebApp() && 'vibrate' in navigator) {
        const pattern = style === 'heavy' ? [40, 60, 40] : [25];
        navigator.vibrate(pattern);
      }
    } catch {
      // Ignore if not supported
    }
  },
  notification: (type: 'error' | 'success' | 'warning') => {
    try {
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred(type);
      if (!isTelegramWebApp() && 'vibrate' in navigator) {
        const pattern = type === 'success' ? [30, 50, 60] : [80, 50, 80];
        navigator.vibrate(pattern);
      }
    } catch {
      // Ignore
    }
  },
  selection: () => {
    try {
      window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
      if (!isTelegramWebApp() && 'vibrate' in navigator) {
        navigator.vibrate(10);
      }
    } catch {
      // Ignore
    }
  }
};
