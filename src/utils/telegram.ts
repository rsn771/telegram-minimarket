/**
 * Утилиты для Telegram Web App (тактильная отдача и т.д.).
 * Вне Mini App вызовы просто игнорируются.
 */

type HapticStyle = "light" | "medium" | "heavy";

export function hapticFeedback(style: HapticStyle = "light"): void {
  if (typeof window === "undefined") return;
  const tg = (window as unknown as { Telegram?: { WebApp?: { HapticFeedback?: { impactOccurred: (s: HapticStyle) => void } } } }).Telegram?.WebApp;
  try {
    tg?.HapticFeedback?.impactOccurred(style);
  } catch {
    // вне Telegram или старый клиент — ничего не делаем
  }
}
