/**
 * Утилиты для работы с Telegram Web App API
 */

export function getTelegramWebApp() {
  if (typeof window === "undefined") {
    return null;
  }
  return window.Telegram?.WebApp || null;
}

export function isTelegramWebApp() {
  return typeof window !== "undefined" && !!window.Telegram?.WebApp;
}

export function useTelegramTheme() {
  const tg = getTelegramWebApp();
  if (!tg) return null;
  
  return {
    bgColor: tg.themeParams.bg_color || "#ffffff",
    textColor: tg.themeParams.text_color || "#000000",
    hintColor: tg.themeParams.hint_color || "#999999",
    linkColor: tg.themeParams.link_color || "#007AFF",
    buttonColor: tg.themeParams.button_color || "#007AFF",
    buttonTextColor: tg.themeParams.button_text_color || "#ffffff",
    secondaryBgColor: tg.themeParams.secondary_bg_color || "#F2F2F7",
  };
}

export function hapticFeedback(style: "light" | "medium" | "heavy" | "rigid" | "soft" = "light") {
  const tg = getTelegramWebApp();
  if (tg) {
    tg.HapticFeedback.impactOccurred(style);
  }
}

export function showTelegramAlert(message: string) {
  const tg = getTelegramWebApp();
  if (tg) {
    tg.showAlert(message);
  } else {
    alert(message);
  }
}

export function showTelegramConfirm(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    const tg = getTelegramWebApp();
    if (tg) {
      tg.showConfirm(message, (confirmed) => {
        resolve(confirmed);
      });
    } else {
      resolve(confirm(message));
    }
  });
}

export function getTelegramUser() {
  const tg = getTelegramWebApp();
  return tg?.initDataUnsafe?.user || null;
}
