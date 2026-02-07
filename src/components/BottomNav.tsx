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
    <nav className="fixed bottom-0 w-full bg-white/80 backdrop-blur-md border-t border-gray-200 h-[83px] flex justify-around pt-3 safe-area-pb">
      {tabs.map(({ id, href, label, Icon }) => {
        const isActive = active === id;
        return (
          <Link
            key={id}
            href={href}
            onClick={() => hapticFeedback("light")}
            className="flex flex-col items-center gap-1 min-w-0 flex-1"
          >
            <div
              className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                isActive ? "bg-[#007AFF] text-white" : "bg-gray-200 text-gray-500"
              }`}
            >
              <Icon size={14} strokeWidth={2.5} />
            </div>
            <span
              className={`text-[10px] font-medium truncate max-w-full px-1 ${
                isActive ? "text-[#007AFF]" : "text-gray-400"
              }`}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
