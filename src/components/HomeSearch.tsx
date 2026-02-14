"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Search } from "lucide-react";
import Link from "next/link";
import { AppCard } from "@/components/AppCard";
import { AppIcon } from "@/components/AppIcon";
import { BottomNav } from "@/components/BottomNav";
import { HeroBanner } from "@/components/HeroBanner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useApps, type AppItem } from "@/context/AppsContext";
import { hapticFeedback } from "@/utils/telegram";
import { truncateToTwoLines } from "@/utils/text";

function filterApps(apps: AppItem[], query: string): AppItem[] {
  if (!query.trim()) return apps;
  const q = query.trim().toLowerCase();
  return apps.filter(
    (app) =>
      app.name.toLowerCase().includes(q) ||
      app.category.toLowerCase().includes(q)
  );
}

const STORAGE_KEY = "home-expand";
const SCROLL_KEY = "home-scroll";

function loadExpanded(): { topCharts: boolean; neural: boolean; games: boolean } {
  if (typeof window === "undefined") return { topCharts: false, neural: false, games: false };
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { topCharts?: boolean; neural?: boolean; games?: boolean };
      return {
        topCharts: !!parsed.topCharts,
        neural: !!parsed.neural,
        games: !!parsed.games,
      };
    }
  } catch {
    // ignore
  }
  return { topCharts: false, neural: false, games: false };
}

function saveExpanded(expanded: { topCharts: boolean; neural: boolean; games: boolean }) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(expanded));
  } catch {
    // ignore
  }
}

export function HomeSearch() {
  const { apps, loading, error } = useApps();
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focused, setFocused] = useState(false);
  const [showAllTopCharts, setShowAllTopCharts] = useState(false);
  const [showAllNeural, setShowAllNeural] = useState(false);
  const [showAllGames, setShowAllGames] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const scrollRestoredRef = useRef(false);

  useEffect(() => {
    const saved = loadExpanded();
    setShowAllTopCharts(saved.topCharts);
    setShowAllNeural(saved.neural);
    setShowAllGames(saved.games);
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
        } catch {
          // ignore
        }
      }
    };
  }, []);

  useEffect(() => {
    if (scrollRestoredRef.current) return;
    const raw = typeof window !== "undefined" ? sessionStorage.getItem(SCROLL_KEY) : null;
    if (raw === null) return;
    const y = parseInt(raw, 10);
    if (Number.isNaN(y)) return;
    scrollRestoredRef.current = true;
    try {
      sessionStorage.removeItem(SCROLL_KEY);
    } catch {
      // ignore
    }
    const id = requestAnimationFrame(() => {
      window.scrollTo(0, y);
    });
    return () => cancelAnimationFrame(id);
  }, [showAllTopCharts, showAllNeural, showAllGames]);

  const matches = useMemo(() => filterApps(apps, query), [apps, query]);
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

  const TOP_CHARTS_VISIBLE = 5;

  // Жёстко заданный порядок топ‑чартов
  const TOP_CHARTS_ORDER = [
    "notcoin",
    "void",
    "major",
    "portals market",
    "gigachat",
    "random beast",
  ];

  // Собираем список приложений для топ‑чартов по имени (без учёта регистра)
  const topChartsApps: AppItem[] = [];
  const topChartsIds = new Set<string>();

  for (const name of TOP_CHARTS_ORDER) {
    const found = apps.find(
      (app) => app.name.trim().toLowerCase() === name.toLowerCase()
    );
    if (found && !topChartsIds.has(String(found.id))) {
      topChartsApps.push(found);
      topChartsIds.add(String(found.id));
    }
  }

  const categoryNorm = (s: string) => (s || "").trim().toLowerCase();
  const neuralApps = apps.filter((app) => categoryNorm(app.category) === "нейросети");
  const gamesApps = apps.filter((app) => categoryNorm(app.category) === "игры");

  const visibleTopCharts = showAllTopCharts
    ? topChartsApps
    : topChartsApps.slice(0, TOP_CHARTS_VISIBLE);

  const visibleNeuralApps = showAllNeural ? neuralApps : neuralApps.slice(0, TOP_CHARTS_VISIBLE);
  const visibleGamesApps = showAllGames ? gamesApps : gamesApps.slice(0, TOP_CHARTS_VISIBLE);

  const persistExpand = (updates: { topCharts?: boolean; neural?: boolean; games?: boolean }) => {
    const next = {
      topCharts: updates.topCharts ?? showAllTopCharts,
      neural: updates.neural ?? showAllNeural,
      games: updates.games ?? showAllGames,
    };
    saveExpanded(next);
  };

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
                      <AppIcon src={app.icon} alt={app.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[15px] text-black dark:text-white truncate">
                        {app.name} <span className="text-[12px] text-gray-500 dark:text-gray-400 font-normal">{app.category}</span>
                      </p>
                      <p className="text-[13px] text-gray-500 dark:text-gray-400 whitespace-pre-line line-clamp-2 mt-0.5">
                        {truncateToTwoLines(app.shortDescription?.trim() || app.description?.trim() || "", 42, 92)}
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

      <div className="pt-[calc(env(safe-area-inset-top,20px)+56px)] overflow-x-hidden min-w-0">
      {error && (
        <div className="mx-4 mt-2 px-4 py-3 rounded-2xl bg-red-500/20 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}
      {loading && apps.length === 0 && (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">Загрузка…</div>
      )}
      <header className="p-5 pt-2">
        <h1 className="text-[34px] font-bold tracking-tight text-black dark:text-white">Сегодня</h1>
        <div className="w-full mt-3 overflow-hidden">
          <HeroBanner />
        </div>
      </header>

      <section id="top-charts" className="mt-2 scroll-mt-[calc(env(safe-area-inset-top,20px)+64px)]">
        <div className="px-5 mb-4 flex justify-between items-end">
          <h2 className="text-[22px] font-bold text-black dark:text-white">Топ чарты</h2>
          <span className="text-[#007AFF] text-[17px]"> </span>
        </div>

        <div className="flex flex-col">
          {visibleTopCharts.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
        {topChartsApps.length > TOP_CHARTS_VISIBLE && (
          <div className="px-5 mt-3">
            <button
              type="button"
              onClick={() => {
                hapticFeedback("light");
                setShowAllTopCharts((prev) => {
                  const next = !prev;
                  persistExpand({ topCharts: next });
                  return next;
                });
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/40 dark:bg-gray-700/40 text-[#007AFF] font-semibold text-[15px] active:opacity-70 transition-colors border border-white/40 dark:border-gray-600/40"
            >
              {showAllTopCharts ? "Скрыть" : "Показать все"}
            </button>
          </div>
        )}

        <div className="w-full max-w-[calc(100%-2.5rem)] mt-4 mx-5 overflow-hidden rounded-2xl bg-white/40 dark:bg-gray-800/40 backdrop-blur-md border border-white/30 dark:border-gray-600/30 box-border">
          <img
            src="/image99.png"
            alt="Mini Market"
            className="max-w-full w-full h-auto object-contain object-left block"
          />
        </div>

        {neuralApps.length > 0 && (
          <>
            <div className="flex flex-col mt-4">
              {visibleNeuralApps.map((app) => (
                <AppCard key={app.id} app={app} />
              ))}
            </div>
            {neuralApps.length > TOP_CHARTS_VISIBLE && (
              <div className="px-5 mt-3">
                <button
                  type="button"
                  onClick={() => {
                    hapticFeedback("light");
                    setShowAllNeural((prev) => {
                      const next = !prev;
                      persistExpand({ neural: next });
                      return next;
                    });
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/40 dark:bg-gray-700/40 text-[#007AFF] font-semibold text-[15px] active:opacity-70 transition-colors border border-white/40 dark:border-gray-600/40"
                >
                  {showAllNeural ? "Скрыть" : "Показать все"}
                </button>
              </div>
            )}
          </>
        )}

        <div className="w-full max-w-[calc(100%-2.5rem)] mt-4 mx-5 overflow-hidden rounded-2xl bg-white/40 dark:bg-gray-800/40 backdrop-blur-md border border-white/30 dark:border-gray-600/30 box-border">
          <img
            src="/image99.png"
            alt="Mini Market"
            className="max-w-full w-full h-auto object-contain object-left block"
          />
        </div>

        {gamesApps.length > 0 && (
          <>
            <div className="flex flex-col mt-4">
              {visibleGamesApps.map((app) => (
                <AppCard key={app.id} app={app} />
              ))}
            </div>
            {gamesApps.length > TOP_CHARTS_VISIBLE && (
              <div className="px-5 mt-3">
                <button
                  type="button"
                  onClick={() => {
                    hapticFeedback("light");
                    setShowAllGames((prev) => {
                      const next = !prev;
                      persistExpand({ games: next });
                      return next;
                    });
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/40 dark:bg-gray-700/40 text-[#007AFF] font-semibold text-[15px] active:opacity-70 transition-colors border border-white/40 dark:border-gray-600/40"
                >
                  {showAllGames ? "Скрыть" : "Показать все"}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <p className="mt-10 mb-6 mx-auto px-4 max-w-[36rem] text-center text-[13px] leading-relaxed text-gray-600 dark:text-gray-400">
        Наш маркет помогает вам находить лучшие сервисы в Telegram. Мы заботливо собираем их в одном месте, но важно помнить: каждое приложение создано независимыми разработчиками. Мы не присваиваем себе авторство сторонних проектов и не можем гарантировать их бесперебойную работу. Мы не занимаемся пропагандой каких-либо идей, товаров или взглядов — наш сервис носит исключительно информационный характер. Пользуйтесь с удовольствием, но будьте бдительны!
      </p>

      <BottomNav active="main" />
      </div>
    </div>
  );
}
