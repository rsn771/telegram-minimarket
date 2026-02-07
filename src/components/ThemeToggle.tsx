"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { hapticFeedback } from "@/utils/telegram";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => {
        hapticFeedback("light");
        toggleTheme();
      }}
      aria-label={isDark ? "Светлая тема" : "Тёмная тема"}
      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-white/40 dark:border-gray-600/40 text-gray-600 dark:text-gray-300 active:scale-95 transition-transform"
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
