"use client";

import Link from "next/link";
import { LayoutGrid, FolderOpen, Smartphone } from "lucide-react";
import { hapticFeedback } from "@/utils/telegram";

type Tab = "main" | "sections" | "my-apps";

const tabs: { id: Tab; href: string; label: string; Icon: typeof LayoutGrid }[] = [
  { id: "main", href: "/", label: "Главная", Icon: LayoutGrid },
  { id: "sections", href: "/sections", label: "Разделы", Icon: FolderOpen },
  { id: "my-apps", href: "/my-apps", label: "Мои приложения", Icon: Smartphone },
];

export function BottomNav({ active }: { active: Tab }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 safe-area-pb pointer-events-none">
      <div className="flex justify-center mb-3">
        <div className="pointer-events-auto w-[92%] max-w-md rounded-[999px] bg-white/15 dark:bg-gray-900/25 backdrop-blur-2xl border border-white/25 dark:border-gray-700/60 shadow-[0_18px_45px_rgba(0,0,0,0.45)] px-2 py-2 flex items-center justify-between gap-1">
          {tabs.map(({ id, href, label, Icon }) => {
            const isActive = active === id;
            return (
              <Link
                key={id}
                href={href}
                onClick={() => hapticFeedback("light")}
                className="flex-1 min-w-0 flex items-center justify-center"
              >
                <div
                  className={`w-full max-w-[120px] flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-[999px] transition-all duration-200 ${
                    isActive
                      ? "bg-white/90 dark:bg-white/90 text-black shadow-[0_10px_25px_rgba(0,0,0,0.35)]"
                      : "bg-white/5 dark:bg-black/10 text-gray-200/80"
                  }`}
                >
                  <div
                    className={`flex items-center justify-center rounded-full ${
                      isActive ? "text-[#007AFF]" : "text-gray-400"
                    }`}
                  >
                    <Icon size={18} strokeWidth={2.4} />
                  </div>
                  <span
                    className={`text-[11px] font-semibold tracking-tight truncate ${
                      isActive ? "text-[#007AFF]" : "text-gray-300"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
