"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

export type AppItem = {
  id: string;
  name: string;
  category: string;
  icon: string;
  rating: number;
  url?: string;
  description?: string;
  screenshots?: string[];
  isVerified?: boolean;
};

type AppsContextType = {
  apps: AppItem[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  getAppById: (id: string) => AppItem | undefined;
};

const AppsContext = createContext<AppsContextType | null>(null);

async function fetchApps(): Promise<AppItem[]> {
  const res = await fetch("/api/channels");
  if (!res.ok) throw new Error("Не удалось загрузить приложения");
  const data = await res.json();
  return data.map(
    (c: {
      id: string;
      name: string;
      category: string;
      icon: string;
      rating: number;
      url?: string;
      description?: string;
      screenshots?: string[];
      isVerified?: boolean;
    }) => ({
      id: c.id,
      name: c.name,
      category: c.category,
      icon: c.icon,
      rating: c.rating,
      url: c.url,
      description: c.description,
      screenshots: c.screenshots,
      isVerified: c.isVerified,
    })
  );
}

export function AppsProvider({ children }: { children: React.ReactNode }) {
  const [apps, setApps] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchApps();
      setApps(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
      setApps([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const getAppById = useCallback((id: string) => apps.find((a) => a.id === id), [apps]);

  return (
    <AppsContext.Provider value={{ apps, loading, error, refetch: load, getAppById }}>
      {children}
    </AppsContext.Provider>
  );
}

export function useApps() {
  const ctx = useContext(AppsContext);
  if (!ctx) throw new Error("useApps must be used within AppsProvider");
  return ctx;
}
