/**
 * Telegram WebApp utility functions
 */

export const getTelegramWebApp = (): TelegramWebApp | null => {
  if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
    return (window as any).Telegram.WebApp;
  }
  return null;
};

export const initTelegramWebApp = () => {
  const tg = getTelegramWebApp();
  if (tg) {
    tg.ready();
    tg.expand();
    return tg;
  }
  return null;
};

export const getTelegramUser = () => {
  const tg = getTelegramWebApp();
  return tg?.initDataUnsafe?.user || null;
};

export const getTelegramTheme = () => {
  const tg = getTelegramWebApp();
  return tg?.themeParams || null;
};
