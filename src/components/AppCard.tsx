"use client";

import { useEffect, useState } from "react";
import { Star, Plus } from "lucide-react";
import Link from "next/link";
import { hapticFeedback } from "@/utils/telegram";
import { useMyApps } from "@/context/MyAppsContext";
import type { AppItem } from "@/context/AppsContext";

function openAppUrl(url: string) {
  const w = typeof window !== "undefined" ? (window as unknown as { Telegram?: { WebApp?: { openTelegramLink?: (url: string) => void; openLink?: (url: string) => void } } }) : null;
  const tg = w?.Telegram?.WebApp;
  if (tg && /^https?:\/\/(t\.me|telegram\.me)\//i.test(url)) {
    tg.openTelegramLink?.(url);
  } else if (tg?.openLink) {
    tg.openLink(url);
  } else {
    window.open(url, "_blank");
  }
}

export const AppCard = ({ app, openDirectly = false }: { app: AppItem; openDirectly?: boolean }) => {
  const { toggleApp, isInMyApps } = useMyApps();
  const appId = String(app.id);
  const [mounted, setMounted] = useState(false);
  
  // Вычисляем inMyApps только после монтирования, чтобы избежать проблем с гидратацией
  const inMyApps = mounted ? isInMyApps(appId) : false;

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClick = () => {
    hapticFeedback("light");
  };

  const handlePlus = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    hapticFeedback("light");
    toggleApp(appId);
  };

  const handleOpenDirect = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    hapticFeedback("medium");
    if (app.url) openAppUrl(app.url);
  };

  return (
    <div className="flex items-center gap-4 p-4 mx-2 rounded-2xl active:bg-white/50 dark:active:bg-gray-800/50 transition-colors">
      <Link href={`/app/${app.id}`} className="flex items-center gap-4 flex-1 min-w-0" onClick={handleClick}>
        <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded-[22%] border border-white/40 dark:border-gray-600/40 shadow-sm">
          <img src={app.icon} className="w-full h-full object-cover" alt={app.name} />
        </div>
        <div className="flex-1 border-b border-gray-200/80 dark:border-gray-600/80 pb-4 min-w-0">
          <h3 className="font-bold text-[17px] text-black dark:text-white tracking-tight">{app.name}</h3>
          <p className="text-gray-500 dark:text-gray-400 text-[14px]">{app.category}</p>
          <div className="flex items-center gap-1 mt-1">
            <Star size={10} className="fill-gray-400 stroke-none" />
            <span className="text-[12px] text-gray-400 font-bold">{Number(app.rating).toFixed(1)}</span>
          </div>
        </div>
      </Link>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={handlePlus}
          aria-label={inMyApps ? "Remove from My apps" : "Add to My apps"}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors active:scale-95 ${
            inMyApps ? "bg-[#007AFF] text-white" : "bg-white/60 dark:bg-gray-700/60 text-gray-500 dark:text-gray-400 border border-white/40 dark:border-gray-600/40"
          }`}
        >
          {inMyApps ? (
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden>
              <path d="M20 6L9 17l-5-5" />
            </svg>
          ) : (
            <Plus size={18} strokeWidth={2.5} />
          )}
        </button>
        {openDirectly && app.url ? (
          <button
            type="button"
            onClick={handleOpenDirect}
            className="bg-white/60 dark:bg-gray-700/60 text-[#007AFF] px-5 py-1.5 rounded-full font-bold text-[13px] uppercase active:opacity-70 border border-white/40 dark:border-gray-600/40"
          >
            Open
          </button>
        ) : (
          <Link
            href={`/app/${app.id}`}
            onClick={handleClick}
            className="bg-white/60 dark:bg-gray-700/60 text-[#007AFF] px-5 py-1.5 rounded-full font-bold text-[13px] uppercase active:opacity-70 border border-white/40 dark:border-gray-600/40"
          >
            Open
          </Link>
        )}
      </div>
    </div>
  );
};