"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { AppCard } from "@/components/AppCard";
import { SECTIONS } from "@/data/sections";
import { useApps } from "@/context/AppsContext";
import { hapticFeedback } from "@/utils/telegram";

export default function SectionPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { apps: allApps, loading } = useApps();

  const section = SECTIONS.find((s) => s.slug === slug);
  const apps = section
    ? allApps.filter((a) => a.category === section.category)
    : [];

  if (loading && apps.length === 0 && section) {
    return (
      <div className="min-h-screen pb-24 bg-transparent flex flex-col items-center justify-center p-5">
        <p className="text-gray-500 dark:text-gray-400">Загрузка…</p>
      </div>
    );
  }
  if (!section) {
    return (
      <div className="min-h-screen pb-24 bg-transparent flex flex-col items-center justify-center p-5">
        <p className="text-gray-500 dark:text-gray-400 text-center">Раздел не найден</p>
        <button onClick={() => router.back()} className="mt-4 text-[#007AFF] font-medium">
          Назад
        </button>
      </div>
    );
  }

  const { title, Icon } = section;

  return (
    <div className="min-h-screen pb-24 bg-transparent">
      <div className="sticky top-0 z-10 flex items-center gap-2 pt-[calc(env(safe-area-inset-top,0px)+1rem)] px-4 pb-4 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-white/20 dark:border-gray-700/50">
        <button
          onClick={() => {
            hapticFeedback("light");
            router.back();
          }}
          className="flex items-center gap-0 text-[#007AFF] font-normal text-[17px]"
        >
          <ChevronLeft size={28} strokeWidth={2} />
          <span className="-ml-1">Назад</span>
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-white/50 dark:bg-gray-700/50 flex items-center justify-center shrink-0 border border-white/40 dark:border-gray-600/40">
            <Icon size={18} className="text-[#007AFF]" />
          </div>
          <h1 className="text-[20px] font-bold truncate text-black dark:text-white">{title}</h1>
        </div>
      </div>

      <section className="mt-2">
        {apps.length === 0 ? (
          <div className="px-5 py-12 text-center text-gray-500 dark:text-gray-400 text-[15px] rounded-2xl mx-2 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md border border-white/30 dark:border-gray-600/30">
            В этом разделе пока нет приложений.
          </div>
        ) : (
          <div className="flex flex-col">
            {apps.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
        )}
      </section>

      <BottomNav active="sections" />
    </div>
  );
}
