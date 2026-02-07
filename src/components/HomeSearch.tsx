"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Search } from "lucide-react";
import Link from "next/link";
import { AppCard } from "@/components/AppCard";
import { BottomNav } from "@/components/BottomNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { APPS } from "@/data/apps";
import { hapticFeedback } from "@/utils/telegram";

function filterApps(query: string) {
  if (!query.trim()) return APPS;
  const q = query.trim().toLowerCase();
  return APPS.filter(
    (app) =>
      app.name.toLowerCase().includes(q) ||
      app.category.toLowerCase().includes(q)
  );
}

export function HomeSearch() {
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => filterApps(query), [query]);
  const hasQuery = query.trim().length > 0;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openSuggestions = hasQuery && focused;
  const displaySuggestions = openSuggestions && matches.length > 0;

  return (
    <div className="min-h-screen pb-24 bg-transparent">
      {/* Фиксированный поискбар без фона, в стиле жидкого стекла */}
      <div
        className="fixed left-0 right-0 z-20 pt-[env(safe-area-inset-top,20px)] px-4 pb-2"
        ref={wrapRef}
      >
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/35 dark:bg-gray-800/35 backdrop-blur-xl border border-white/30 dark:border-gray-600/30 min-w-0 shadow-lg shadow-black/5">
            <Search size={20} className="text-gray-500 dark:text-gray-400 shrink-0" />
            <input
              ref={inputRef}
              type="search"
              placeholder="Поиск приложений"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              className="flex-1 bg-transparent text-[17px] text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 outline-none min-w-0"
              aria-label="Поиск"
              aria-autocomplete="list"
              aria-expanded={displaySuggestions}
            />
          </div>
          <ThemeToggle />
        </div>

        {displaySuggestions && (
          <div className="mt-2 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/30 dark:border-gray-600/30 shadow-xl overflow-hidden max-h-[280px] overflow-y-auto">
            <p className="px-4 py-2 text-[12px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight">
              Совпадения
            </p>
            <ul className="pb-2" role="listbox">
              {matches.slice(0, 8).map((app) => (
                <li key={app.id} role="option">
                  <Link
                    href={`/app/${app.id}`}
                    onClick={() => {
                      hapticFeedback("light");
                      setQuery("");
                      setShowSuggestions(false);
                      inputRef.current?.blur();
                    }}
                    className="flex items-center gap-3 px-4 py-3 active:bg-black/5 dark:active:bg-white/5 transition-colors"
                  >
                    <div className="w-10 h-10 flex-shrink-0 overflow-hidden rounded-[18%] border border-gray-200/80 dark:border-gray-600/80">
                      <img src={app.icon} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[15px] text-black dark:text-white truncate">
                        {app.name}
                      </p>
                      <p className="text-[13px] text-gray-500 dark:text-gray-400 truncate">
                        {app.category}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {hasQuery && matches.length === 0 && (
          <p className="mt-2 px-2 text-[15px] text-gray-500 dark:text-gray-400">
            Ничего не найдено по запросу «{query.trim()}»
          </p>
        )}
      </div>

      <div className="pt-[calc(env(safe-area-inset-top,20px)+56px)]">
      <header className="p-5 pt-2">
        <h1 className="text-[34px] font-bold tracking-tight text-black dark:text-white">Сегодня</h1>
        <div className="w-full mt-3 overflow-hidden rounded-2xl bg-white/40 dark:bg-gray-800/40 backdrop-blur-md border border-white/30 dark:border-gray-600/30">
          <img
            src="/logo-main.png"
            alt="Mini Market"
            className="w-full h-auto object-contain object-left block"
          />
        </div>
      </header>

      <section className="mt-2">
        <div className="px-5 mb-4 flex justify-between items-end">
          <h2 className="text-[22px] font-bold text-black dark:text-white">Топ чарты</h2>
          <span className="text-[#007AFF] text-[17px]">См. все</span>
        </div>

        <div className="flex flex-col">
          {(query.trim() ? matches : APPS).map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
      </section>

      <BottomNav active="main" />
      </div>
    </div>
  );
}
