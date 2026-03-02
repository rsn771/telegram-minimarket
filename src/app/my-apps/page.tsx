"use client";

import { useState, useMemo } from "react";
import { 
  Search, 
  ChevronDown, 
  ChevronRight,
  Bot,
  Shield,
  Gamepad2,
  SearchCode,
  Wrench,
  Wallet,
  Bitcoin,
  PartyPopper,
  Users,
  GraduationCap,
  Smartphone
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AppCard } from "@/components/AppCard";
import { useApps, type AppItem } from "@/context/AppsContext";
import { useMyApps } from "@/context/MyAppsContext";
import { hapticFeedback } from "@/utils/telegram";

const CATEGORY_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  "Нейросети": { icon: Bot, color: "text-violet-500" },
  "VPN": { icon: Shield, color: "text-emerald-500" },
  "Игры": { icon: Gamepad2, color: "text-pink-500" },
  "Пробив": { icon: SearchCode, color: "text-amber-500" },
  "Утилиты": { icon: Wrench, color: "text-slate-500" },
  "Финансы": { icon: Wallet, color: "text-green-500" },
  "Криптовалюта": { icon: Bitcoin, color: "text-orange-500" },
  "Развлечения": { icon: PartyPopper, color: "text-yellow-500" },
  "Социальные": { icon: Users, color: "text-blue-500" },
  "Образование": { icon: GraduationCap, color: "text-cyan-500" },
};

const DEFAULT_ICON = { icon: Smartphone, color: "text-gray-500" };

export default function MyAppsPage() {
  const { apps, loading } = useApps();
  const { myAppIds, setMyAppIds } = useMyApps();
  const [query, setQuery] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [draggedApp, setDraggedApp] = useState<AppItem | null>(null);

  const myApps = useMemo(() => {
    return myAppIds
      .map((id) => apps.find((app) => app.id === id))
      .filter((app): app is AppItem => app !== undefined);
  }, [apps, myAppIds]);

  const filteredApps = useMemo(() => {
    if (!query.trim()) return myApps;
    const q = query.toLowerCase();
    return myApps.filter(
      (app) =>
        app.name.toLowerCase().includes(q) ||
        app.category.toLowerCase().includes(q) ||
        (app.description?.toLowerCase().includes(q) ?? false)
    );
  }, [myApps, query]);

  const groupedByCategory = useMemo(() => {
    const groups: Record<string, AppItem[]> = {};
    for (const app of filteredApps) {
      const cat = app.category || "Другое";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(app);
    }
    return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  }, [filteredApps]);

  const toggleCategory = (category: string) => {
    hapticFeedback("light");
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const handleDragStart = (app: AppItem) => {
    hapticFeedback("medium");
    setDraggedApp(app);
  };

  const handleDragOver = (e: React.DragEvent, targetApp: AppItem) => {
    e.preventDefault();
    if (!draggedApp || draggedApp.id === targetApp.id) return;
  };

  const handleDrop = (targetApp: AppItem) => {
    if (!draggedApp || draggedApp.id === targetApp.id) {
      setDraggedApp(null);
      return;
    }
    hapticFeedback("light");
    
    const draggedIdx = myAppIds.indexOf(draggedApp.id);
    const targetIdx = myAppIds.indexOf(targetApp.id);
    
    if (draggedIdx === -1 || targetIdx === -1) {
      setDraggedApp(null);
      return;
    }

    const newIds = [...myAppIds];
    newIds.splice(draggedIdx, 1);
    newIds.splice(targetIdx, 0, draggedApp.id);
    setMyAppIds(newIds);
    setDraggedApp(null);
  };

  const handleDragEnd = () => {
    setDraggedApp(null);
  };

  return (
    <div className="min-h-screen pb-24 bg-transparent">
      <div className="fixed left-0 right-0 z-10 pt-[env(safe-area-inset-top,20px)] px-4 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/35 dark:bg-gray-800/35 backdrop-blur-xl border border-white/30 dark:border-gray-600/30 min-w-0 shadow-lg shadow-black/5">
            <Search size={20} className="text-gray-500 dark:text-gray-400 shrink-0" />
            <input
              type="search"
              placeholder="Поиск в моих приложениях"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-[17px] text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 outline-none min-w-0"
              aria-label="Поиск"
            />
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="pt-[calc(env(safe-area-inset-top,20px)+56px)]">
        <header className="p-5 pt-4 flex items-baseline justify-between">
          <h1 className="text-[34px] font-bold tracking-tight text-black dark:text-white">Мои приложения</h1>
          {myApps.length > 0 && (
            <span className="text-[15px] text-gray-500 dark:text-gray-400">{myApps.length}</span>
          )}
        </header>

        <section className="mt-2">
          {loading && myApps.length === 0 ? (
            <div className="px-5 py-12 text-center text-gray-500 dark:text-gray-400 text-[15px]">Загрузка…</div>
          ) : myApps.length === 0 ? (
            <div className="px-5 py-12 text-center text-gray-500 dark:text-gray-400 text-[15px] rounded-2xl mx-2 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md border border-white/30 dark:border-gray-600/30">
              Пока ничего нет. Нажмите + на карточке приложения или на странице приложения, чтобы добавить сюда.
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="px-5 py-12 text-center text-gray-500 dark:text-gray-400 text-[15px]">
              Ничего не найдено по запросу &quot;{query}&quot;
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {groupedByCategory.map(([category, categoryApps]) => {
                const isCollapsed = collapsedCategories.has(category);
                const categoryStyle = CATEGORY_ICONS[category] || DEFAULT_ICON;
                const IconComponent = categoryStyle.icon;
                
                return (
                  <div key={category}>
                    <button
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className="w-full flex items-center gap-3 px-5 py-2.5 text-left active:opacity-70 transition-opacity"
                    >
                      {isCollapsed ? (
                        <ChevronRight size={18} className="text-gray-400 shrink-0" />
                      ) : (
                        <ChevronDown size={18} className="text-gray-400 shrink-0" />
                      )}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${categoryStyle.color} bg-current/10`}>
                        <IconComponent size={18} strokeWidth={2} className={categoryStyle.color} />
                      </div>
                      <span className="text-[15px] font-semibold text-gray-700 dark:text-gray-300">
                        {category}
                      </span>
                      <span className="text-[13px] text-gray-400 dark:text-gray-500 ml-auto">
                        {categoryApps.length}
                      </span>
                    </button>
                    
                    {!isCollapsed && (
                      <div className="flex flex-col">
                        {categoryApps.map((app) => (
                          <div
                            key={app.id}
                            draggable
                            onDragStart={() => handleDragStart(app)}
                            onDragOver={(e) => handleDragOver(e, app)}
                            onDrop={() => handleDrop(app)}
                            onDragEnd={handleDragEnd}
                            className={`cursor-grab active:cursor-grabbing transition-opacity ${
                              draggedApp?.id === app.id ? "opacity-50" : ""
                            }`}
                          >
                            <AppCard app={app} openDirectly />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <BottomNav active="my-apps" />
      </div>
    </div>
  );
}
