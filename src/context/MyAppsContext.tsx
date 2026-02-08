"use client";

import { createContext, useContext, useCallback, useState, useEffect } from "react";

const STORAGE_KEY = "telegram-minimarket-my-apps";

type MyAppsContextType = {
  myAppIds: string[];
  addApp: (id: string) => void;
  removeApp: (id: string) => void;
  toggleApp: (id: string) => void;
  isInMyApps: (id: string) => boolean;
};

const MyAppsContext = createContext<MyAppsContextType | null>(null);

function loadFromStorage(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function saveToStorage(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {}
}

export function MyAppsProvider({ children }: { children: React.ReactNode }) {
  const [myAppIds, setMyAppIds] = useState<string[]>([]);

  useEffect(() => {
    setMyAppIds(loadFromStorage());
  }, []);

  const persist = useCallback((ids: string[]) => {
    setMyAppIds(ids);
    saveToStorage(ids);
  }, []);

  const addApp = useCallback(
    (id: string) => {
      persist([...new Set([...myAppIds, id])]);
    },
    [myAppIds, persist]
  );

  const removeApp = useCallback(
    (id: string) => {
      persist(myAppIds.filter((x) => x !== id));
    },
    [myAppIds, persist]
  );

  const toggleApp = useCallback(
    (id: string) => {
      if (myAppIds.includes(id)) removeApp(id);
      else addApp(id);
    },
    [myAppIds, addApp, removeApp]
  );

  const isInMyApps = useCallback(
    (id: string) => myAppIds.includes(id),
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
