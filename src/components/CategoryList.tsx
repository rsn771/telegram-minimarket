"use client";

import { useState, useEffect } from "react";
import { AppCard } from "@/components/AppCard";
import type { AppItem } from "@/context/AppsContext";

const SLUG_TO_CATEGORY: Record<string, string> = {
  neuro: "Нейросети",
  games: "Игры",
  probiv: "Пробив",
  vpn: "VPN",
};

type Props = { slug: string };

export function CategoryList({ slug }: Props) {
  const [apps, setApps] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);
  const category = SLUG_TO_CATEGORY[slug] ?? slug;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/channels?category=${encodeURIComponent(category)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setApps(data);
      })
      .catch(() => {
        if (!cancelled) setApps([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [category]);

  if (loading) {
    return (
      <div className="py-4">
        <p className="text-gray-500 dark:text-gray-400 text-sm">Загрузка...</p>
      </div>
    );
  }

  if (apps.length === 0) {
    return (
      <div className="py-4">
        <p className="text-gray-500 dark:text-gray-400 text-sm">Список приложений пока пуст.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 pb-4">
      {apps.map((app) => (
        <AppCard key={app.id} app={app} />
      ))}
    </div>
  );
}
