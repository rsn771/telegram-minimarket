"use client";

import { Search } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AppCard } from "@/components/AppCard";
import { useApps } from "@/context/AppsContext";
import { useMyApps } from "@/context/MyAppsContext";

export default function MyAppsPage() {
  const { apps, loading } = useApps();
  const { myAppIds } = useMyApps();
  const myApps = apps.filter((app) => myAppIds.includes(app.id));

  return (
    <div className="min-h-screen pb-24 bg-transparent">
      <div className="fixed left-0 right-0 z-10 pt-[env(safe-area-inset-top,20px)] px-4 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/35 dark:bg-gray-800/35 backdrop-blur-xl border border-white/30 dark:border-gray-600/30 min-w-0 shadow-lg shadow-black/5">
            <Search size={20} className="text-gray-500 dark:text-gray-400 shrink-0" />
            <input
              type="search"
              placeholder="Search"
              className="flex-1 bg-transparent text-[17px] text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 outline-none min-w-0"
              aria-label="Search"
            />
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="pt-[calc(env(safe-area-inset-top,20px)+56px)]">
      <header className="p-5 pt-4">
        <h1 className="text-[34px] font-bold tracking-tight text-black dark:text-white">My apps</h1>
      </header>

      <section className="mt-2">
        {loading && myApps.length === 0 ? (
          <div className="px-5 py-12 text-center text-gray-500 dark:text-gray-400 text-[15px]">Loading…</div>
        ) : myApps.length === 0 ? (
          <div className="px-5 py-12 text-center text-gray-500 dark:text-gray-400 text-[15px] rounded-2xl mx-2 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md border border-white/30 dark:border-gray-600/30">
            Nothing here yet. Tap + on a card or on an app page to add it.
          </div>
        ) : (
          <div className="flex flex-col">
            {myApps.map((app) => (
              <AppCard key={app.id} app={app} openDirectly />
            ))}
          </div>
        )}
      </section>

      <BottomNav active="my-apps" />
      </div>
    </div>
  );
}
