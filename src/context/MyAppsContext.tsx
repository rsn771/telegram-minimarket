"use client";

import { createContext, useContext, useCallback, useState, useEffect } from "react";

const STORAGE_KEY = "telegram-minimarket-my-apps";

type MyAppsContextType = {
  myAppIds: number[];
  addApp: (id: number) => void;
  removeApp: (id: number) => void;
  toggleApp: (id: number) => void;
  isInMyApps: (id: number) => boolean;
};

const MyAppsContext = createContext<MyAppsContextType | null>(null);

function loadFromStorage(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(Number).filter((n) => !Number.isNaN(n)) : [];
  } catch {
    return [];
  }
}

function saveToStorage(ids: number[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {}
}

export function MyAppsProvider({ children }: { children: React.ReactNode }) {
  const [myAppIds, setMyAppIds] = useState<number[]>([]);

  useEffect(() => {
    setMyAppIds(loadFromStorage());
  }, []);

  const persist = useCallback((ids: number[]) => {
    setMyAppIds(ids);
    saveToStorage(ids);
  }, []);

  const addApp = useCallback(
    (id: number) => {
      persist([...new Set([...myAppIds, id])]);
    },
    [myAppIds, persist]
  );

  const removeApp = useCallback(
    (id: number) => {
      persist(myAppIds.filter((x) => x !== id));
    },
    [myAppIds, persist]
  );

  const toggleApp = useCallback(
    (id: number) => {
      if (myAppIds.includes(id)) removeApp(id);
      else addApp(id);
    },
    [myAppIds, addApp, removeApp]
  );

  const isInMyApps = useCallback(
    (id: number) => myAppIds.includes(id),
    [myAppIds]
  );

  return (
    <MyAppsContext.Provider value={{ myAppIds, addApp, removeApp, toggleApp, isInMyApps }}>
      {children}
    </MyAppsContext.Provider>
  );
}

export function useMyApps() {
  const ctx = useContext(MyAppsContext);
  if (!ctx) throw new Error("useMyApps must be used within MyAppsProvider");
  return ctx;
}
