"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Star, Share, ShieldCheck, Zap, Plus } from "lucide-react";
import { hapticFeedback } from "@/utils/telegram";
import { useApps } from "@/context/AppsContext";
import { useMyApps } from "@/context/MyAppsContext";

export default function AppDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { getAppById, loading } = useApps();
  const { toggleApp, isInMyApps } = useMyApps();
  const [fullscreenScreenshotIndex, setFullscreenScreenshotIndex] = useState<number | null>(null);
  const app = typeof id === "string" ? getAppById(id) : undefined;

  if (loading) return <div className="p-10 text-center font-sans text-black dark:text-white bg-transparent">Загрузка…</div>;
  if (!app) return <div className="p-10 text-center font-sans text-black dark:text-white bg-transparent">Приложение не найдено</div>;

  const inMyApps = isInMyApps(app.id);

  const handleBack = () => {
    hapticFeedback("light");
    router.back();
  };

  const handleShare = () => {
    hapticFeedback("medium");
  };

  const handleOpen = () => {
    hapticFeedback("medium");
    if (!app.url) return;
    const w = typeof window !== "undefined" ? (window as unknown as { Telegram?: { WebApp?: { openTelegramLink?: (url: string) => void; openLink?: (url: string) => void } } }) : null;
    const tg = w?.Telegram?.WebApp;
    if (tg && /^https?:\/\/(t\.me|telegram\.me)\//i.test(app.url)) {
      tg.openTelegramLink?.(app.url);
    } else if (tg?.openLink) {
      tg.openLink(app.url);
    } else {
      window.open(app.url, "_blank");
    }
  };

  const handlePlus = () => {
    hapticFeedback("light");
    toggleApp(app.id);
  };

  const openScreenshot = (index: number) => {
    hapticFeedback("light");
    setFullscreenScreenshotIndex(index);
  };

  const closeScreenshot = () => {
    hapticFeedback("light");
    setFullscreenScreenshotIndex(null);
  };

  return (
    <div className="min-h-screen pb-10 font-sans antialiased bg-transparent">
      <div className="pt-[calc(1rem+env(safe-area-inset-top,0px)+2.5rem)] px-4 pb-2 flex justify-between items-center bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl sticky top-0 z-50 border-b border-white/20 dark:border-gray-700/50">
        <button onClick={handleBack} className="text-[#007AFF] flex items-center gap-0 font-normal text-[17px]">
          <ChevronLeft size={32} strokeWidth={2} /> 
          <span className="-ml-1">Назад</span>
        </button>
        <button onClick={handleShare}>
          <Share size={22} className="text-[#007AFF]" />
        </button>
      </div>

      <div className="mx-3 mt-1 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/40 dark:border-gray-600/40 pb-6 overflow-hidden">
        <div className="px-5 flex gap-5 mt-4">
          <div className="relative shrink-0">
            <img src={app.icon} className="w-28 h-28 rounded-[22%] shadow-lg border border-white/40 dark:border-gray-600/40 object-cover" alt={app.name} />
          </div>
          <div className="flex flex-col justify-between py-1">
            <div>
              <h1 className="text-[22px] font-bold leading-tight tracking-tight text-black dark:text-white">{app.name}</h1>
              <p className="text-gray-500 dark:text-gray-400 text-[15px] font-medium">{app.category.toUpperCase()}</p>
            </div>
            <div className="flex items-center gap-2">
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
              <button 
                onClick={handleOpen}
                className="bg-[#007AFF] active:scale-95 transition-transform text-white px-8 py-1.5 rounded-full font-bold text-sm uppercase w-fit shadow-md"
              >
                Открыть
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-around border-t border-gray-200/80 dark:border-gray-600/80 mt-8 py-4 mx-5">
          <div className="text-center flex-1">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase mb-1">Рейтинг</p>
            <p className="text-[20px] font-black text-gray-700 dark:text-gray-200 flex items-center gap-1 justify-center">
              {Number(app.rating) || 0} <Star size={16} className="fill-gray-700 dark:fill-gray-300 stroke-none" />
            </p>
          </div>
          <div className="w-[1px] bg-gray-200 dark:bg-gray-600 h-8 self-center"></div>
          <div className="text-center flex-1 px-2">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase mb-1">Безопасность</p>
            <p className="text-[20px] font-black text-gray-700 dark:text-gray-200 flex justify-center">
              {app.isVerified ? <ShieldCheck className="text-green-500" /> : <ShieldCheck className="text-gray-400 dark:text-gray-500" />}
            </p>
          </div>
        </div>
      </div>

      {app.screenshots && app.screenshots.length > 0 && (
        <div className="mt-3 mx-3 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/40 dark:border-gray-600/40 py-6 overflow-hidden">
          <h2 className="px-5 text-[20px] font-bold mb-4 tracking-tight text-black dark:text-white">Предпросмотр</h2>
          <div className="flex gap-4 overflow-x-auto px-5 no-scrollbar items-end">
            {app.screenshots.map((src, i) => (
              <button
                key={i}
                type="button"
                onClick={() => openScreenshot(i)}
                className="flex-shrink-0 rounded-xl overflow-hidden shadow-lg border border-white/40 dark:border-gray-600/40 bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:ring-offset-2 dark:focus:ring-offset-gray-900 active:opacity-90"
              >
                <img src={src} alt={`Скриншот ${i + 1}`} className="max-h-[420px] w-auto object-contain block" />
              </button>
            ))}
          </div>
        </div>
      )}
      {(!app.screenshots || app.screenshots.length === 0) && (
        <div className="mt-3 mx-3 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/40 dark:border-gray-600/40 py-6 overflow-hidden">
          <h2 className="px-5 text-[20px] font-bold mb-4 tracking-tight text-black dark:text-white">Предпросмотр</h2>
          <div className="flex gap-4 overflow-x-auto px-5 no-scrollbar">
            {[1, 2, 3].map((i) => (
              <div key={i} className="min-w-[260px] h-[460px] bg-gradient-to-br from-blue-500 to-purple-600 rounded-[2.5rem] flex-shrink-0 shadow-xl overflow-hidden relative border-[6px] border-black/20 dark:border-gray-600">
                <div className="absolute top-0 w-full h-6 bg-black flex justify-center">
                  <div className="w-20 h-4 bg-black rounded-b-xl"></div>
                </div>
                <div className="flex flex-col items-center justify-center h-full text-white p-8 text-center">
                  <Zap size={48} className="mb-4 opacity-50" />
                  <div className="text-xl font-bold italic">AMAZING INTERFACE</div>
                  <div className="text-sm opacity-70 mt-2 text-balance">Built for Telegram Mini Apps 2026</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mx-3 mt-3 px-5 py-6 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/40 dark:border-gray-600/40">
        <h2 className="text-[20px] font-bold mb-3 tracking-tight text-black dark:text-white">Описание</h2>
        <p className="text-gray-600 dark:text-gray-300 leading-[1.5] text-[16px] font-normal whitespace-pre-line">
          {app.description || "Описание пока не добавлено."}
        </p>
      </div>

      {app.screenshots && fullscreenScreenshotIndex !== null && app.screenshots[fullscreenScreenshotIndex] && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label="Просмотр скриншота"
          onClick={closeScreenshot}
        >
          <div className="flex items-center gap-2 pt-[calc(1rem+env(safe-area-inset-top,0px)+2.5rem)] px-4 pb-4 bg-black/50 border-b border-white/10 shrink-0">
            <button
              type="button"
              onClick={closeScreenshot}
              className="flex items-center gap-0 text-white font-normal text-[17px] py-2 pr-3 -ml-1"
            >
              <ChevronLeft size={28} strokeWidth={2} />
              <span className="-ml-1">Назад</span>
            </button>
            <span className="text-white/70 text-sm">
              {fullscreenScreenshotIndex + 1} / {app.screenshots.length}
            </span>
          </div>
          <div
            className="flex-1 flex items-center justify-center min-h-0 p-4 overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={app.screenshots[fullscreenScreenshotIndex]}
              alt={`Скриншот ${fullscreenScreenshotIndex + 1}`}
              className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}