"use client";

import { useApps, type AppItem } from "@/context/AppsContext";
import { useSplashDone } from "@/components/SplashScreen";
import { useMemo, useState, useEffect } from "react";
import { hapticFeedback } from "@/utils/telegram";
import { AppIcon } from "@/components/AppIcon";

const BANNER_TEXT = "Погрузитесь в мир\nмини-приложений";
const TYPEWRITER_DELAY_MS = 43;

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
    for (let i = 0; i < count; i++) out.push(apps[i % apps.length]);
    return out;
  }, [apps, count]);
}

function getIconPosition(app: AppItem, place: { top: string; left: string }) {
  const name = (app.name || "").trim().toLowerCase();
  if (name === "major") return { top: "5%", left: "12%" };
  if (name.includes("magic") && name.includes("market")) return { top: "91%", left: "88%" };
  return { top: place.top, left: place.left };
}

export function HeroBanner() {
  const { apps } = useApps();
  const splashDone = useSplashDone();
  const bannerIcons = useBannerIcons(apps, ICON_PLACES.length);
  const [visibleLength, setVisibleLength] = useState(0);

  useEffect(() => {
    if (!splashDone || visibleLength >= BANNER_TEXT.length) return;
    const id = setTimeout(() => setVisibleLength((n) => Math.min(n + 1, BANNER_TEXT.length)), TYPEWRITER_DELAY_MS);
    return () => clearTimeout(id);
  }, [splashDone, visibleLength]);

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl bg-white dark:bg-gray-900 backdrop-blur-md border border-white/50 dark:border-gray-600/30 shadow-inner"
      style={{ aspectRatio: "3/4", maxHeight: "420px" }}
    >
      <div className="absolute inset-0 bg-white dark:bg-gray-900" aria-hidden />
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

      {/* Парящие иконки */}
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
                <AppIcon src={app.icon} alt={app.name} className="w-full h-full object-cover" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Текст: печать по буквам + мигающий курсор */}
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
          {BANNER_TEXT.slice(0, visibleLength).split("\n").map((line, i) => (
            <span key={i}>{i > 0 && <br />}{line}</span>
          ))}
          {visibleLength < BANNER_TEXT.length && (
            <span className="animate-blink-cursor" aria-hidden>|</span>
          )}
        </p>
      </div>

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
