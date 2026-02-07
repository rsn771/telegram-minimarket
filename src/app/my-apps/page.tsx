"use client";

import { Search } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AppCard } from "@/components/AppCard";
import { useMyApps } from "@/context/MyAppsContext";
import { APPS } from "@/data/apps";

export default function MyAppsPage() {
  const { myAppIds } = useMyApps();
  const myApps = APPS.filter((app) => myAppIds.includes(app.id));

  return (
    <div className="min-h-screen pb-24 bg-transparent">
      <div className="sticky top-0 z-10 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-white/20 dark:border-gray-700/50">
        <div className="px-4 pt-4 pb-2 flex items-center gap-2">
          <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-md border border-white/40 dark:border-gray-600/40">
            <Search size={20} className="text-gray-500 dark:text-gray-400 shrink-0" />
            <input
              type="search"
              placeholder="Поиск"
              className="flex-1 bg-transparent text-[17px] text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 outline-none min-w-0"
              aria-label="Поиск"
            />
          </div>
          <ThemeToggle />
        </div>
      </div>

      <header className="p-5 pt-4">
        <h1 className="text-[34px] font-bold tracking-tight text-black dark:text-white">Мои приложения</h1>
      </header>

      <section className="mt-2">
        {myApps.length === 0 ? (
          <div className="px-5 py-12 text-center text-gray-500 dark:text-gray-400 text-[15px] rounded-2xl mx-2 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md border border-white/30 dark:border-gray-600/30">
            Пока ничего нет. Нажмите + на карточке приложения или на странице приложения, чтобы добавить сюда.
          </div>
        ) : (
          <div className="flex flex-col">
            {myApps.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
        )}
      </section>

      <BottomNav active="my-apps" />
    </div>
  );
}
