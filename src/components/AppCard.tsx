"use client";

import { Star, Plus } from "lucide-react";
import Link from "next/link";
import { hapticFeedback } from "@/utils/telegram";
import { useMyApps } from "@/context/MyAppsContext";

export const AppCard = ({ app }: any) => {
  const { toggleApp, isInMyApps } = useMyApps();
  const inMyApps = isInMyApps(app.id);

  const handleClick = () => {
    hapticFeedback("light");
  };

  const handlePlus = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    hapticFeedback("light");
    toggleApp(app.id);
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
            <span className="text-[12px] text-gray-400 font-bold">{app.rating}</span>
          </div>
        </div>
      </Link>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={handlePlus}
          aria-label={inMyApps ? "Убрать из моих приложений" : "Добавить в мои приложения"}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors active:scale-95 ${
            inMyApps ? "bg-[#007AFF] text-white" : "bg-white/60 dark:bg-gray-700/60 text-gray-500 dark:text-gray-400 border border-white/40 dark:border-gray-600/40"
          }`}
        >
          <Plus size={18} strokeWidth={2.5} />
        </button>
        <Link
          href={`/app/${app.id}`}
          onClick={handleClick}
          className="bg-white/60 dark:bg-gray-700/60 text-[#007AFF] px-5 py-1.5 rounded-full font-bold text-[13px] uppercase active:opacity-70 border border-white/40 dark:border-gray-600/40"
        >
          Открыть
        </Link>
      </div>
    </div>
  );
};