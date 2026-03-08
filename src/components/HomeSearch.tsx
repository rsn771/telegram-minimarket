"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Search, X, ChevronRight, Star, Eye, Send, GraduationCap, Wand2, Bitcoin, Sparkles, TrendingUp } from "lucide-react";
import Link from "next/link";
import { AppCard } from "@/components/AppCard";
import { AppIcon } from "@/components/AppIcon";
import { BottomNav } from "@/components/BottomNav";
import { CategoryList } from "@/components/CategoryList";
import { HeroBanner } from "@/components/HeroBanner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useApps, type AppItem } from "@/context/AppsContext";
import { hapticFeedback } from "@/utils/telegram";

const CATEGORY_MODAL_TITLES: Record<string, string> = {
  neuro: "Лучшие нейросети",
  games: "Лучшие игры",
  probiv: "Лучший пробив",
  vpn: "Лучшие VPN",
};

function filterApps(apps: AppItem[], query: string): AppItem[] {
  if (!query.trim()) return apps;
  const q = query.trim().toLowerCase();
  return apps.filter(
    (app) =>
      app.name.toLowerCase().includes(q) ||
      app.id.toLowerCase().includes(q) ||
      app.category.toLowerCase().includes(q) ||
      (app.description?.toLowerCase().includes(q) ?? false)
  );
}

const STORAGE_KEY = "home-expand-v2";
const SCROLL_KEY = "home-scroll";
const VPN_VISIBLE = 4;

function loadExpanded(): { topCharts: boolean; neural: boolean; games: boolean; vpn: boolean } {
  if (typeof window === "undefined") return { topCharts: false, neural: false, games: false, vpn: false };
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { topCharts?: boolean; neural?: boolean; games?: boolean; vpn?: boolean };
      return {
        topCharts: !!parsed.topCharts,
        neural: !!parsed.neural,
        games: !!parsed.games,
        vpn: !!parsed.vpn,
      };
    }
  } catch {
    // ignore
  }
  return { topCharts: false, neural: false, games: false, vpn: false };
}

function saveExpanded(expanded?: { topCharts?: boolean; neural?: boolean; games?: boolean; vpn?: boolean }) {
  if (typeof window === "undefined") return;
  try {
    const prev = loadExpanded();
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prev, ...expanded }));
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
  const [showAllVpn, setShowAllVpn] = useState(false);
  const [categoryModalSlug, setCategoryModalSlug] = useState<string | null>(null);
  const [rixonBlurred, setRixonBlurred] = useState(false);
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([]);
  const [collectionModalSlug, setCollectionModalSlug] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const scrollRestoredRef = useRef(false);
  const rixonBannerRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const saved = loadExpanded();
    setShowAllTopCharts(saved.topCharts);
    setShowAllNeural(saved.neural);
    setShowAllGames(saved.games);
    setShowAllVpn(!!saved.vpn);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem("recently-viewed-apps");
      if (stored) {
        setRecentlyViewedIds(JSON.parse(stored) as string[]);
      }
    } catch {
      // ignore
    }
    const handleStorage = () => {
      try {
        const stored = localStorage.getItem("recently-viewed-apps");
        if (stored) {
          setRecentlyViewedIds(JSON.parse(stored) as string[]);
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleStorage);
    };
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
  }, [showAllTopCharts, showAllNeural, showAllGames, showAllVpn]);

  useEffect(() => {
    if (!rixonBannerRef.current) return;
    let blurTimeout: ReturnType<typeof setTimeout> | null = null;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setRixonBlurred(true);
          blurTimeout = setTimeout(() => {
            setRixonBlurred(false);
          }, 3000);
        } else {
          if (blurTimeout) {
            clearTimeout(blurTimeout);
            blurTimeout = null;
          }
          setRixonBlurred(false);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(rixonBannerRef.current);
    return () => {
      observer.disconnect();
      if (blurTimeout) clearTimeout(blurTimeout);
    };
  }, []);

  const matches = useMemo(() => filterApps(apps, query), [apps, query]);
  const hasQuery = query.trim().length > 0;

  const vpnApps = useMemo(() => apps.filter((a) => a.category === "VPN"), [apps]);


  const vpnCardIcons = useMemo(() => {
    const find = (q: string) => apps.find((a) => a.name.toLowerCase().includes(q));
    return [
      { name: "Velvet VPN", app: find("velvet") },
      { name: "Quattro VPN", app: find("quattro") },
      { name: "Shadownet VPN", app: find("shadownet") },
      { name: "Boxy VPN", app: find("boxy") },
      { name: "VPN Direct", app: find("vpn direct") },
    ];
  }, [apps]);

  const gamesCardIcons = useMemo(() => {
    const find = (q: string) => apps.find((a) => a.name.toLowerCase().includes(q));
    return [
      { name: "Void", app: find("void") },
      { name: "Boinker", app: find("boinker") },
      { name: "Allgames", app: find("allgames") },
      { name: "Fomo Fighters", app: find("fomo fighters") },
      { name: "Glance Game", app: find("glance game") },
    ];
  }, [apps]);

  const probivCardIcons = useMemo(() => {
    const find = (q: string) => apps.find((a) => a.name.toLowerCase().includes(q));
    return [
      { name: "Sherlok", app: find("sherlok") },
      { name: "Funstat", app: find("funstat") },
      { name: "Himera Search", app: find("himera") },
    ];
  }, [apps]);

  const neuroCardIcons = useMemo(() => {
    const find = (q: string) => apps.find((a) => a.name.toLowerCase().includes(q));
    return [
      { name: "ChatGPT 5 Neiroseti", app: find("chatgpt 5 neiroseti") },
      { name: "ChatGPT 5 | Gemini 3", app: find("gemini 3") },
      { name: "GigaChat", app: find("gigachat") },
      { name: "GPT-4 Unlimited", app: find("gpt-4 unlimited") },
      { name: "Mira", app: find("mira") },
      { name: "Syntx AI", app: find("syntx") },
      { name: "Collage", app: find("collage") },
    ];
  }, [apps]);

  const NEW_APP_IDS = ["ClashRoyaleimpostorbot", "aleksobot", "vpndirectbot", "boxyvpn_bot", "QuizariumBot", "ChessContestBot", "durakru_bot", "TrueMafiaBot", "gpt3_unlim_chatbot", "lootmeme_bot", "lootglide_bot"];

  const newApps = useMemo(() => {
    return NEW_APP_IDS
      .map((id) => apps.find((a) => a.id === id))
      .filter(Boolean) as typeof apps;
  }, [apps]);

  const appOfTheDay = useMemo(() => {
    return apps.find((a) => a.id === "make_selfie_bot");
  }, [apps]);

  const recentlyViewedApps = useMemo(() => {
    return recentlyViewedIds
      .map((id) => apps.find((a) => a.id === id))
      .filter(Boolean) as typeof apps;
  }, [apps, recentlyViewedIds]);

  const COLLECTIONS = useMemo(() => [
    { slug: "must-have", title: "Нужны всем", icon: Star, gradient: "from-amber-400 to-orange-500", iconColor: "text-amber-100", appIds: ["4", "27", "25"] },
    { slug: "spy", title: "Шпион", icon: Eye, gradient: "from-slate-700 to-slate-900", iconColor: "text-slate-300", appIds: ["notspybot", "41", "sherlok_bot", "25"] },
    { slug: "tgk", title: "Для своего ТГК", icon: Send, gradient: "from-sky-400 to-blue-600", iconColor: "text-sky-100", appIds: ["6", "anonaskbot", "anonimnyye_voprosy_bot", "box14bot", "22"] },
    { slug: "study", title: "Учёба", icon: GraduationCap, gradient: "from-emerald-400 to-green-600", iconColor: "text-emerald-100", appIds: ["chatgpt_gpt4bot", "GPT4Telegrambot", "4", "13", "15", "clips_robot", "iqcoinapp_bot"] },
    { slug: "generation", title: "Генерация", icon: Wand2, gradient: "from-violet-500 to-purple-700", iconColor: "text-violet-100", appIds: ["chatgpt_gpt4bot", "GPT4Telegrambot", "4", "gpt3_unlim_chatbot", "aleksobot", "40", "trendiobot", "mira", "syntxaibot", "collage"] },
    { slug: "crypto", title: "Криптоинвестор", icon: Bitcoin, gradient: "from-orange-400 to-yellow-500", iconColor: "text-orange-100", appIds: ["21", "11", "3", "1", "30"] },
  ], []);

  const collectionApps = useMemo(() => {
    if (!collectionModalSlug) return [];
    const collection = COLLECTIONS.find((c) => c.slug === collectionModalSlug);
    if (!collection) return [];
    return collection.appIds
      .map((id) => apps.find((a) => a.id === id))
      .filter(Boolean) as typeof apps;
  }, [apps, collectionModalSlug, COLLECTIONS]);

  // Блокируем скролл фона, когда открыт модал категорий или подборок
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!categoryModalSlug && !collectionModalSlug) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [categoryModalSlug, collectionModalSlug]);

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

  const TOP_CHARTS_VISIBLE = 4;

  // Жёстко заданный порядок топ‑чартов (первые 4 видимы, остальные скрыты)
  const TOP_CHARTS_ORDER = [
    "Mira",
    "Syntx AI",
    "Collage",
    "not spy bot",
    "rsn bot | чеки и переводы",
    "notcoin",
    "void",
    "major",
    "gigachat",
    "random beast",
    "Toncast",
    "Fomo Fighters",
    "Glance Game",
    "ChatGalaTon",
  ];

  // Приложения под вторым баннером (NFT подарки)
  const NFT_GIFTS_ORDER = [
    "portals market",
    "tonnel relayer bot",
    "virus game bot",
    "rolls",
    "magic market",
    "easy gift",
    "battles",
    "autogifts",
    "empty",
  ];

  // Приложения под третьим баннером (Пробив) - те же что во вкладке "Лучший пробив"
  const PROBIV_KEYWORDS = ["funstat", "himera", "sherlok"];

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
  
  // Собираем список приложений для раздела NFT подарки по имени
  const nftGiftsApps: AppItem[] = [];
  const nftGiftsIds = new Set<string>();
  for (const name of NFT_GIFTS_ORDER) {
    const found = apps.find(
      (app) => app.name.trim().toLowerCase() === name.toLowerCase()
    );
    if (found && !nftGiftsIds.has(String(found.id))) {
      nftGiftsApps.push(found);
      nftGiftsIds.add(String(found.id));
    }
  }
  
  // Приложения для раздела Пробив (по ключевым словам в названии)
  const probivApps = apps.filter((app) =>
    PROBIV_KEYWORDS.some((kw) => app.name.toLowerCase().includes(kw))
  );

  const visibleTopCharts = showAllTopCharts
    ? topChartsApps
    : topChartsApps.slice(0, TOP_CHARTS_VISIBLE);

  const visibleNftGiftsApps = showAllNeural ? nftGiftsApps : nftGiftsApps.slice(0, TOP_CHARTS_VISIBLE);
  const visibleProbivApps = showAllGames ? probivApps : probivApps.slice(0, TOP_CHARTS_VISIBLE);

  const persistExpand = (updates: { topCharts?: boolean; neural?: boolean; games?: boolean; vpn?: boolean }) => {
    const next = {
      topCharts: updates.topCharts ?? showAllTopCharts,
      neural: updates.neural ?? showAllNeural,
      games: updates.games ?? showAllGames,
      vpn: updates.vpn ?? showAllVpn,
    };
    saveExpanded(next);
  };

  const vpnListUnderBanner = useMemo(() => {
    const oldApps = vpnCardIcons.map((c) => c.app).filter(Boolean) as AppItem[];
    const oldIds = new Set(oldApps.map((a) => a.id));
    const newApps = vpnApps.filter((a) => !oldIds.has(a.id));
    return [...oldApps, ...newApps];
  }, [vpnCardIcons, vpnApps]);
  const visibleVpnApps = showAllVpn ? vpnListUnderBanner : vpnListUnderBanner.slice(0, VPN_VISIBLE);
  const hiddenVpnCount = Math.max(0, vpnListUnderBanner.length - VPN_VISIBLE);
  const popularNotShownApps = useMemo(() => {
    const shownIds = new Set<string>();
    if (appOfTheDay) shownIds.add(appOfTheDay.id);
    NEW_APP_IDS.forEach((id) => shownIds.add(id));
    recentlyViewedIds.forEach((id) => shownIds.add(id));
    topChartsApps.forEach((a) => shownIds.add(a.id));
    vpnCardIcons.forEach((c) => c.app && shownIds.add(c.app.id));
    gamesCardIcons.forEach((c) => c.app && shownIds.add(c.app.id));
    probivCardIcons.forEach((c) => c.app && shownIds.add(c.app.id));
    neuroCardIcons.forEach((c) => c.app && shownIds.add(c.app.id));
    vpnListUnderBanner.forEach((a) => shownIds.add(a.id));
    nftGiftsApps.forEach((a) => shownIds.add(a.id));
    probivApps.forEach((a) => shownIds.add(a.id));
    ['TrueMafiaBot','durakru_bot','14','ChessContestBot','QuizariumBot','26','aleksobot'].forEach((id) => shownIds.add(id));
    return apps
      .filter((a) => !shownIds.has(a.id))
      .sort((a, b) => {
        const mauA = a.mau ?? 0;
        const mauB = b.mau ?? 0;
        if (mauB !== mauA) return mauB - mauA;
        return (b.rating ?? 0) - (a.rating ?? 0);
      })
      .slice(0, 16);
  }, [apps, appOfTheDay, recentlyViewedIds, topChartsApps, vpnCardIcons, gamesCardIcons, probivCardIcons, neuroCardIcons, vpnListUnderBanner, nftGiftsApps, probivApps]);


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
                      <p className="text-[13px] text-gray-500 dark:text-gray-400 line-clamp-2 break-words overflow-hidden mt-0.5">
                        {(app.shortDescription?.trim() || app.description?.trim() || "").slice(0, 280)}
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

      {appOfTheDay && (
        <section id="app-of-the-day" className="mt-6 px-5 scroll-mt-[calc(env(safe-area-inset-top,20px)+64px)]">
          <h2 className="text-[22px] font-bold text-black dark:text-white mb-4">Приложение дня</h2>
          <Link
            href={`/app/${appOfTheDay.id}`}
            onClick={() => hapticFeedback("light")}
            className="block rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-[2px] shadow-xl shadow-purple-500/20"
          >
            <div className="rounded-[22px] bg-white dark:bg-gray-900 p-5">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 flex-shrink-0 overflow-hidden rounded-[18px] border-2 border-white/20 shadow-lg">
                  <AppIcon src={appOfTheDay.icon} alt={appOfTheDay.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[18px] font-bold text-black dark:text-white">{appOfTheDay.name}</h3>
                    <ChevronRight className="text-indigo-500 flex-shrink-0" size={28} strokeWidth={3} />
                  </div>
                  <p className="text-[14px] text-indigo-600 dark:text-indigo-400 font-medium mt-1">{appOfTheDay.category}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-yellow-500">★</span>
                    <span className="text-[14px] font-medium text-gray-700 dark:text-gray-300">{appOfTheDay.rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-[15px] leading-relaxed text-gray-600 dark:text-gray-400">
                {appOfTheDay.description || "Узнавайте об удалённых и изменённых сообщениях в ваших чатах. Бот мгновенно уведомит вас, когда кто-то удалит или отредактирует сообщение — вы всегда будете в курсе."}
              </p>
              <p className="mt-3 text-[13px] text-gray-500 dark:text-gray-500">Выбор редакции</p>
            </div>
          </Link>
        </section>
      )}

      {newApps.length > 0 && (
        <section className="mt-6">
          <div className="flex items-center gap-2 px-5 mb-4">
            <Sparkles size={20} className="text-yellow-500" />
            <h2 className="text-[22px] font-bold text-black dark:text-white">Новинки</h2>
          </div>
          <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide pb-2">
            {newApps.map((app) => (
              <Link
                key={app.id}
                href={`/app/${app.id}`}
                onClick={() => hapticFeedback("light")}
                className="flex-shrink-0 w-28"
              >
                <div className="w-16 h-16 mx-auto overflow-hidden rounded-[18px] border-2 border-yellow-400/50 shadow-lg shadow-yellow-500/20 active:scale-95 transition-transform">
                  <AppIcon src={app.icon} alt={app.name} className="w-full h-full object-cover" />
                </div>
                <p className="mt-2 text-[12px] text-center text-gray-700 dark:text-gray-300 truncate">{app.name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}


      {recentlyViewedApps.length > 0 && (
        <section className="mt-6">
          <h2 className="text-[22px] font-bold text-black dark:text-white px-5 mb-4">Смотрели недавно</h2>
          <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide pb-2">
            {recentlyViewedApps.map((app) => (
              <Link
                key={app.id}
                href={`/app/${app.id}`}
                onClick={() => hapticFeedback("light")}
                className="flex-shrink-0"
              >
                <div className="w-16 h-16 overflow-hidden rounded-[18px] border border-gray-200/80 dark:border-gray-600/80 shadow-sm active:scale-95 transition-transform">
                  <AppIcon src={app.icon} alt={app.name} className="w-full h-full object-cover" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section id="top-charts" className="mt-6 scroll-mt-[calc(env(safe-area-inset-top,20px)+64px)]">
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
          <div className="px-5 mt-3 mb-6">
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

        <section className="mt-8">
          <h2 className="text-[22px] font-bold text-black dark:text-white px-5 mb-4">Подборки</h2>
          <div className="flex gap-4 px-5 overflow-x-auto scrollbar-hide pb-3">
            {COLLECTIONS.map((collection) => {
              const IconComponent = collection.icon;
              return (
                <button
                  key={collection.slug}
                  type="button"
                  onClick={() => {
                    hapticFeedback("light");
                    setCollectionModalSlug(collection.slug);
                  }}
                  className={`flex-shrink-0 w-36 h-28 rounded-2xl bg-gradient-to-br ${collection.gradient} shadow-lg flex flex-col items-center justify-center gap-2 active:scale-95 transition-all duration-200 hover:shadow-xl`}
                >
                  <IconComponent size={32} strokeWidth={2} className={collection.iconColor} />
                  <span className="text-[13px] font-bold text-white text-center px-2 leading-tight drop-shadow-sm">
                    {collection.title}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <div
          className="mt-8 mb-8 py-6"
          style={{
            background: "linear-gradient(to bottom, transparent 0%, rgb(31 41 55) 10%, rgb(31 41 55) 90%, transparent 100%)",
          }}
        >
          <div className="flex flex-col gap-3 px-5">
          {(
            [
              { label: "Лучшие нейросети", slug: "neuro" },
              { label: "Лучшие игры", slug: "games" },
              { label: "Лучший пробив", slug: "probiv" },
              { label: "Лучшие vpn", slug: "vpn" },
            ] as const
          ).map((item, i) => {
            const label = item.label;
            const slug = item.slug;
            const glowColors = [
              "rgba(59, 130, 246, 0.45)",
              "rgba(34, 197, 94, 0.45)",
              "rgba(239, 68, 68, 0.5)",
              "rgba(168, 85, 247, 0.5)",
            ];
            const glowColorsStrong = [
              "rgba(0, 204, 255, 0.9)",
              "rgba(0, 255, 136, 0.9)",
              "rgba(255, 51, 102, 0.9)",
              "rgba(191, 0, 255, 0.9)",
            ];
            const shadowRgb = [
              [15, 23, 42],
              [6, 28, 18],
              [42, 15, 18],
              [28, 15, 42],
            ];
            const [sr, sg, sb] = shadowRgb[i] ?? shadowRgb[0];
            const c = glowColors[i] ?? glowColors[0];
            const cStrong = glowColorsStrong[i] ?? glowColorsStrong[0];
            const glow =
              `radial-gradient(ellipse 80% 60% at 0% 100%, ${c} 0%, transparent 70%), ` +
              `radial-gradient(ellipse 140% 120% at 100% 0%, ${c} 0%, transparent 70%), ` +
              `radial-gradient(ellipse 140% 120% at 100% 100%, ${c} 0%, transparent 70%), ` +
              `radial-gradient(ellipse 50% 100% at 100% 50%, ${cStrong} 0%, transparent 65%)`;
            const shadow = `0 0 24px rgba(${sr},${sg},${sb},0.85), 0 0 60px rgba(${sr},${sg},${sb},0.65), 0 0 120px rgba(${sr},${sg},${sb},0.45), 0 0 180px rgba(${sr},${sg},${sb},0.25)`;
            const isNeuro = i === 0;
            const isGames = i === 1;
            const isProbiv = i === 2;
            const isVpn = i === 3;
            const cardIcons = isVpn ? vpnCardIcons : isGames ? gamesCardIcons : isProbiv ? probivCardIcons : isNeuro ? neuroCardIcons : null;
            return (
            <button
              key={label}
              type="button"
              onClick={() => {
                hapticFeedback("light");
                setCategoryModalSlug(slug);
              }}
              className="block relative w-full overflow-hidden rounded-2xl border border-gray-600/40 flex items-center bg-gray-900 text-left"
              style={{
                aspectRatio: "3/1",
                contain: "layout",
                backgroundImage: glow,
                boxShadow: shadow,
              }}
            >
              <span
                className="relative z-10 pl-5 text-left text-white font-sans font-extrabold leading-tight drop-shadow-sm"
                style={{
                  fontSize: "clamp(1rem, 4.5vw, 1.35rem)",
                  textShadow: "0 1px 2px rgba(0,0,0,0.08)",
                  letterSpacing: "-0.02em",
                }}
              >
                {label}
              </span>
              {cardIcons && (
                <div className="absolute right-6 top-1/2 z-10 pointer-events-none flex items-center gap-4" style={{ transform: "translateY(calc(-50% + 6px))" }} aria-hidden>
                  <div className="animate-icon-float shrink-0" style={{ animationDelay: "0s" }}>
                    <div
                      className="w-14 h-14 rounded-[22%] border border-white/30 shadow-md bg-white/80 overflow-hidden opacity-90"
                      style={{ transform: "rotate(-12deg)", transformOrigin: "center center" }}
                    >
                      <AppIcon src={cardIcons[0]?.app?.icon ?? ""} alt={cardIcons[0]?.name ?? ""} className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end -translate-y-1" style={{ marginRight: 2 }}>
                    <div className="animate-icon-float shrink-0" style={{ animationDelay: "0.15s" }}>
                      <div
                        className="w-10 h-10 rounded-[22%] border border-white/30 shadow-md bg-white/80 overflow-hidden opacity-90"
                        style={{ transform: "rotate(8deg)", transformOrigin: "center center" }}
                      >
                        <AppIcon src={cardIcons[1]?.app?.icon ?? ""} alt={cardIcons[1]?.name ?? ""} className="w-full h-full object-cover" />
                      </div>
                    </div>
                    <div className="animate-icon-float shrink-0" style={{ animationDelay: "0.3s" }}>
                      <div
                        className="w-[44px] h-[44px] rounded-[22%] border border-white/30 shadow-md bg-white/80 overflow-hidden opacity-90"
                        style={{ transform: "rotate(-8deg)", transformOrigin: "center center" }}
                      >
                        <AppIcon src={cardIcons[2]?.app?.icon ?? ""} alt={cardIcons[2]?.name ?? ""} className="w-full h-full object-cover" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </button>
            );
          })}
          </div>
        </div>

        <Link
          href="/app/ClashRoyaleimpostorbot"
          className="relative w-full max-w-[calc(100%-2.5rem)] mt-8 mx-5 overflow-hidden rounded-2xl block"
          onClick={() => hapticFeedback("light")}
        >
          <img
            src="/spy-banner.png"
            alt="Игра в Шпиона"
            className="w-full h-auto object-cover block"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent px-5 py-4">
            <div className="flex items-center justify-between">
              <span className="text-white font-semibold text-[17px]">Перейти</span>
              <ChevronRight className="text-white" size={24} strokeWidth={2} />
            </div>
          </div>
        </Link>
        <div className="w-full max-w-[calc(100%-2.5rem)] mt-6 mx-5 overflow-hidden rounded-2xl bg-white/40 dark:bg-gray-800/40 backdrop-blur-md border border-white/30 dark:border-gray-600/30 box-border">
          <img
            src="/nft-banner.png"
            alt="NFT подарки"
            className="max-w-full w-full h-auto object-contain object-left block"
          />
        </div>

        {nftGiftsApps.length > 0 && (
          <>
            <div className="flex flex-col mt-4">
              {visibleNftGiftsApps.map((app) => (
                <AppCard key={app.id} app={app} />
              ))}
            </div>
            {nftGiftsApps.length > TOP_CHARTS_VISIBLE && (
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
            src="/probiv-banner.png"
            alt="Пробив"
            className="max-w-full w-full h-auto object-contain object-left block"
          />
        </div>

        {probivApps.length > 0 && (
          <>
            <div className="flex flex-col mt-4">
              {visibleProbivApps.map((app) => (
                <AppCard key={app.id} app={app} />
              ))}
            </div>
            {probivApps.length > TOP_CHARTS_VISIBLE && (
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

      <div className="w-full max-w-[calc(100%-2.5rem)] mt-8 mx-5 overflow-hidden rounded-2xl bg-white/40 dark:bg-gray-800/40 backdrop-blur-md border border-white/30 dark:border-gray-600/30 box-border">
        <img
          src="/vpn-banner.png"
          alt="VPN"
          className="max-w-full w-full h-auto object-contain object-left block"
        />
      </div>

      {vpnListUnderBanner.length > 0 && (
        <section className="mt-4">
          <div className="flex flex-col">
            {visibleVpnApps.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
          {hiddenVpnCount > 0 && (
            <div className="px-5 mt-3">
              <button
                type="button"
                onClick={() => {
                  hapticFeedback("light");
                  setShowAllVpn((prev) => {
                    const next = !prev;
                    persistExpand({ vpn: next });
                    return next;
                  });
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/40 dark:bg-gray-700/40 text-[#007AFF] font-semibold text-[15px] active:opacity-70 transition-colors border border-white/40 dark:border-gray-600/40"
              >
                {showAllVpn ? "Скрыть" : `Показать все (${hiddenVpnCount})`}
              </button>
            </div>
          )}
        </section>
      )}

      <div className="w-full max-w-[calc(100%-2.5rem)] mt-8 mx-5 overflow-hidden rounded-2xl bg-white/40 dark:bg-gray-800/40 backdrop-blur-md border border-white/30 dark:border-gray-600/30 box-border">
        <img
          src="/team-games-banner.png"
          alt="Командные игры"
          className="max-w-full w-full h-auto object-contain object-left block"
        />
      </div>

      {apps.length > 0 && (
        <section className="mt-4">
          <div className="flex flex-col">
            {apps
              .filter((app) =>
                ["TrueMafiaBot", "durakru_bot", "14", "ChessContestBot", "QuizariumBot"].includes(app.id),
              )
              .map((app) => (
                <AppCard key={app.id} app={app} />
              ))}
          </div>
        </section>
      )}

      <Link
        ref={rixonBannerRef}
        href="/app/26"
        className="relative w-full max-w-[calc(100%-2.5rem)] mt-8 mx-5 overflow-hidden rounded-2xl block"
        onClick={() => hapticFeedback("light")}
      >
        <img
          src="/rixon-banner.png"
          alt="R1xon Cheats"
          className={`w-full h-auto object-cover block transition-all duration-500 ${rixonBlurred ? "blur-md scale-105" : ""}`}
        />
        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${rixonBlurred ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        >
          <span className="text-white text-2xl font-bold drop-shadow-lg">читы для игр🤫</span>
        </div>
        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent px-5 py-4 transition-opacity duration-500 ${rixonBlurred ? "opacity-0" : "opacity-100"}`}>
          <div className="flex items-center justify-between">
            <span className="text-white font-semibold text-[17px]">Перейти</span>
            <ChevronRight className="text-white" size={24} strokeWidth={2} />
          </div>
        </div>
      </Link>

      <Link
        href="/app/aleksobot"
        className="relative w-full max-w-[calc(100%-2.5rem)] mt-8 mx-5 overflow-hidden rounded-2xl block"
        onClick={() => hapticFeedback("light")}
      >
        <img
          src="/alekso-banner.png"
          alt="Бот Алёша"
          className="w-full h-auto object-cover block"
        />
      </Link>

      {popularNotShownApps.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center gap-2 px-5 mb-4">
            <TrendingUp size={20} className="text-[#007AFF]" />
            <h2 className="text-[22px] font-bold text-black dark:text-white">Популярное</h2>
          </div>
          <div className="flex flex-col">
            {popularNotShownApps.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
        </section>
      )}

      <p className="mt-10 mb-6 mx-auto px-4 max-w-[36rem] text-center text-[13px] leading-relaxed text-gray-600 dark:text-gray-400">
        Наш маркет помогает вам находить лучшие сервисы в Telegram. Мы заботливо собираем их в одном месте, но важно помнить: каждое приложение создано независимыми разработчиками. Мы не присваиваем себе авторство сторонних проектов и не можем гарантировать их бесперебойную работу. Мы не занимаемся пропагандой каких-либо идей, товаров или взглядов — наш сервис носит исключительно информационный характер. Пользуйтесь с удовольствием, но будьте бдительны!
      </p>

      {categoryModalSlug && (
        <div
          className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={CATEGORY_MODAL_TITLES[categoryModalSlug] ?? "Категория"}
          onClick={() => {
            hapticFeedback("light");
            setCategoryModalSlug(null);
          }}
        >
          <div
            className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-gray-800 shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
              <h3 className="text-[20px] font-bold text-black dark:text-white">
                {CATEGORY_MODAL_TITLES[categoryModalSlug] ?? categoryModalSlug}
              </h3>
              <button
                type="button"
                onClick={() => {
                  hapticFeedback("light");
                  setCategoryModalSlug(null);
                }}
                className="p-2 -m-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 active:opacity-70 transition-opacity"
                aria-label="Закрыть"
              >
                <X size={24} strokeWidth={2} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 min-h-0 px-2">
              {(() => {
                const modalApps =
                  categoryModalSlug === "vpn"
                     ? vpnCardIcons.map((c) => c.app).filter(Boolean) as AppItem[]
                    : categoryModalSlug === "games"
                    ? gamesCardIcons.map((c) => c.app).filter(Boolean) as AppItem[]
                    : categoryModalSlug === "probiv"
                    ? probivCardIcons.map((c) => c.app).filter(Boolean) as AppItem[]
                    : categoryModalSlug === "neuro"
                    ? neuroCardIcons.map((c) => c.app).filter(Boolean) as AppItem[]
                    : [];
                if (modalApps.length === 0) {
                  return (
                    <div className="py-6">
                      <p className="text-gray-500 dark:text-gray-400 text-sm text-center">Список приложений пока пуст.</p>
                    </div>
                  );
                }
                return (
                  <div className="flex flex-col gap-2 pb-4">
                    {modalApps.map((app) => (
                      <AppCard key={app.id} app={app} />
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {collectionModalSlug && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={() => setCollectionModalSlug(null)}
        >
          <div
            className="w-full max-w-lg bg-white/90 dark:bg-gray-900/95 backdrop-blur-xl rounded-t-3xl shadow-2xl flex flex-col max-h-[80dvh] animate-[slideUp_0.25s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200/60 dark:border-gray-700/60">
              {(() => {
                const col = COLLECTIONS.find((c) => c.slug === collectionModalSlug);
                const IconComp = col?.icon;
                return (
                  <h3 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
                    {IconComp && <IconComp size={22} strokeWidth={2} className="text-gray-600 dark:text-gray-300" />}
                    {col?.title}
                  </h3>
                );
              })()}
              <button
                type="button"
                onClick={() => setCollectionModalSlug(null)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-200/80 dark:bg-gray-700/80 text-gray-600 dark:text-gray-300 active:bg-gray-300 dark:active:bg-gray-600 transition-colors"
              >
                <X size={24} strokeWidth={2} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 min-h-0 px-2">
              {collectionApps.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Скоро здесь появятся приложения</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2 pb-4">
                  {collectionApps.map((app) => (
                    <AppCard key={app.id} app={app} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <BottomNav active="main" />
      </div>
    </div>
  );
}
