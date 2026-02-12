"use client";

import { useApps, type AppItem } from "@/context/AppsContext";
import { useMemo } from "react";
import { hapticFeedback } from "@/utils/telegram";

// Иконки по краям, центр свободен под текст — больше иконок, крупнее
const ICON_PLACES: { top: string; left: string; rotate: number; scale: number; rotateY?: number }[] = [
  { top: "2%", left: "1%", rotate: -15, scale: 0.9, rotateY: 8 },
  { top: "3%", left: "22%", rotate: 12, scale: 0.85, rotateY: -10 },
  { top: "4%", left: "76%", rotate: -18, scale: 0.9, rotateY: 12 },
  { top: "5%", left: "94%", rotate: 10, scale: 0.85 },
  { top: "16%", left: "2%", rotate: 8, scale: 0.85 },
  { top: "18%", left: "88%", rotate: -12, scale: 0.8 },
  { top: "22%", left: "18%", rotate: -6, scale: 0.75 },
  { top: "24%", left: "82%", rotate: 14, scale: 0.8 },
  { top: "72%", left: "4%", rotate: -8, scale: 0.8 },
  { top: "74%", left: "90%", rotate: 16, scale: 0.85 },
  { top: "78%", left: "14%", rotate: 10, scale: 0.75, rotateY: -6 },
  { top: "80%", left: "78%", rotate: -14, scale: 0.8 },
  { top: "88%", left: "2%", rotate: 9, scale: 0.85 },
  { top: "90%", left: "28%", rotate: -10, scale: 0.75 },
  { top: "92%", left: "72%", rotate: 12, scale: 0.8 },
  { top: "94%", left: "94%", rotate: -8, scale: 0.8 },
  { top: "8%", left: "48%", rotate: 6, scale: 0.7 },
  { top: "86%", left: "52%", rotate: -9, scale: 0.75 },
  { top: "42%", left: "0%", rotate: 14, scale: 0.7 },
  { top: "48%", left: "96%", rotate: -11, scale: 0.72 },
];

function useBannerIcons(apps: AppItem[], count: number): AppItem[] {
  return useMemo(() => {
    if (apps.length === 0) return [];
    const out: AppItem[] = [];
    for (let i = 0; i < count; i++) {
      out.push(apps[i % apps.length]);
    }
    return out;
  }, [apps, count]);
}

// Отдельные позиции для иконок, чтобы не залазили на текст и другие иконки
function getIconPosition(
  app: AppItem,
  place: { top: string; left: string }
): { top: string; left: string } {
  const name = (app.name || "").trim().toLowerCase();
  if (name === "major") return { top: "5%", left: "12%" };
  if (name.includes("magic") && name.includes("market")) return { top: "91%", left: "88%" };
  return { top: place.top, left: place.left };
}

export function HeroBanner() {
  const { apps } = useApps();
  const bannerIcons = useBannerIcons(apps, ICON_PLACES.length);

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl bg-white dark:bg-gray-900 backdrop-blur-md border border-white/50 dark:border-gray-600/30 shadow-inner"
      style={{ aspectRatio: "3/4", maxHeight: "420px" }}
    >
      {/* Белый фон */}
      <div className="absolute inset-0 bg-white dark:bg-gray-900" aria-hidden />

      {/* Пятна: синий и розовый чуть интенсивнее, переливаются поверх белого */}
      <div
        className="absolute inset-0 animate-gradient-shift opacity-95 dark:opacity-85"
        style={{
          backgroundImage: [
            "radial-gradient(ellipse 80% 50% at 20% 30%, rgba(0, 122, 255, 0.52) 0%, transparent 55%)",
            "radial-gradient(ellipse 60% 60% at 75% 25%, rgba(236, 72, 153, 0.48) 0%, transparent 55%)",
            "radial-gradient(ellipse 70% 45% at 80% 75%, rgba(0, 122, 255, 0.42) 0%, transparent 50%)",
            "radial-gradient(ellipse 55% 55% at 15% 70%, rgba(244, 114, 182, 0.45) 0%, transparent 50%)",
            "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(0, 122, 255, 0.28) 0%, transparent 45%)",
          ].join(", "),
        }}
      />

      {/* Иконки по краям с эффектом парения */}
      <div className="absolute inset-0 pointer-events-none z-0" aria-hidden>
        {bannerIcons.map((app, i) => {
          const place = ICON_PLACES[i];
          if (!place) return null;
          const { top, left } = getIconPosition(app, place);
          const transform = place.rotateY
            ? `perspective(400px) rotate(${place.rotate}deg) rotateY(${place.rotateY}deg) scale(${place.scale})`
            : `perspective(400px) rotate(${place.rotate}deg) scale(${place.scale})`;
          return (
            <div
              key={`${app.id}-${i}`}
              className="absolute animate-icon-float"
              style={{
                top,
                left,
                width: "clamp(44px, 14vw, 72px)",
                height: "clamp(44px, 14vw, 72px)",
                animationDelay: `${(i * 0.12) % 3.5}s`,
              }}
            >
              <div
                className="h-full w-full rounded-[22%] border border-gray-200/50 dark:border-gray-500/30 shadow-md bg-white/70 dark:bg-gray-800/50 overflow-hidden opacity-60 dark:opacity-55"
                style={{
                  transform,
                  transformOrigin: "center center",
                }}
              >
                <img
                  src={app.icon}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Текст поверх всего: читаемость на светлом фоне */}
      <div className="absolute inset-0 flex items-center justify-center px-6 z-20">
        <p
          className="text-center text-gray-900 dark:text-white font-sans font-extrabold leading-tight drop-shadow-sm"
          style={{
            fontSize: "clamp(1.75rem, 6.5vw, 2.75rem)",
            textShadow: "0 1px 2px rgba(0,0,0,0.08)",
            maxWidth: "20ch",
            letterSpacing: "-0.02em",
          }}
        >
          Погрузитесь в мир
          <br />
          мини-приложений
        </p>
      </div>

      {/* Кнопка «Вперед» в стиле жидкого стекла: скролл к Топ чарты */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center z-20 px-4">
        <button
          type="button"
          onClick={() => {
            hapticFeedback("light");
            document.getElementById("top-charts")?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          className="px-6 py-3 rounded-2xl bg-white/35 dark:bg-gray-800/35 backdrop-blur-xl border border-white/30 dark:border-gray-600/30 shadow-lg shadow-black/5 text-gray-900 dark:text-white font-semibold text-[17px] active:opacity-80 transition-opacity"
        >
          Вперед
        </button>
      </div>
    </div>
  );
}
