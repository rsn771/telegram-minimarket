"use client";

import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { SECTIONS } from "@/data/sections";
import { hapticFeedback } from "@/utils/telegram";

export default function SectionsPage() {
  return (
    <div className="min-h-screen pb-24 bg-transparent pt-[calc(env(safe-area-inset-top,0px)+3rem)]">
      <header className="p-5 pt-6">
        <h1 className="text-[34px] font-bold tracking-tight text-black dark:text-white">Разделы</h1>
      </header>

      <section className="px-4 pb-6">
        <div className="grid grid-cols-2 gap-3">
          {SECTIONS.map(({ slug, title, Icon }) => (
            <Link
              key={slug}
              href={`/sections/${slug}`}
              onClick={() => hapticFeedback("light")}
              className="aspect-square rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-md flex flex-col items-center justify-center gap-3 active:opacity-80 transition-opacity border border-white/40 dark:border-gray-600/40"
            >
              <div className="w-12 h-12 rounded-xl bg-white/70 dark:bg-gray-700/70 flex items-center justify-center border border-white/40 dark:border-gray-600/40">
                <Icon size={26} className="text-[#007AFF]" strokeWidth={2} />
              </div>
              <span className="text-[17px] font-bold text-black dark:text-white text-center px-2">
                {title}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <BottomNav active="sections" />
    </div>
  );
}
