"use client";

import { Search } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { AppCard } from "@/components/AppCard";
import { useMyApps } from "@/context/MyAppsContext";
import { APPS } from "@/data/apps";

export default function MyAppsPage() {
  const { myAppIds } = useMyApps();
  const myApps = APPS.filter((app) => myAppIds.includes(app.id));

  return (
    <div className="bg-white min-h-screen pb-24 text-black">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="px-4 py-3 flex items-center gap-3 bg-[#F2F2F7] rounded-xl mx-4 mt-4 mb-2">
          <Search size={20} className="text-gray-400 shrink-0" />
          <input
            type="search"
            placeholder="Поиск"
            className="flex-1 bg-transparent text-[17px] text-black placeholder:text-gray-400 outline-none"
            aria-label="Поиск"
          />
        </div>
      </div>

      <header className="p-5 pt-4">
        <h1 className="text-[34px] font-bold tracking-tight">Мои приложения</h1>
      </header>

      <section className="mt-2">
        {myApps.length === 0 ? (
          <div className="px-5 py-12 text-center text-gray-500 text-[15px]">
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
