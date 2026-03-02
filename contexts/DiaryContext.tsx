"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { listDiaryEntries } from "@/lib/diary";
import { getStreak } from "@/lib/streak";
import type { DiaryEntry } from "@/lib/types";

interface DiaryContextValue {
  entries: DiaryEntry[];
  loading: boolean;
  reloadEntries: () => Promise<void>;
  streak: number;
}

const DiaryContext = createContext<DiaryContextValue | null>(null);

export function DiaryProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const list = await listDiaryEntries();
    setEntries(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user) {
      setEntries([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    load();
  }, [user, load]);

  const streak = getStreak(entries);

  return (
    <DiaryContext.Provider value={{ entries, loading, reloadEntries: load, streak }}>
      {children}
    </DiaryContext.Provider>
  );
}

export function useDiary() {
  const ctx = useContext(DiaryContext);
  if (!ctx) throw new Error("useDiary must be used within DiaryProvider");
  return ctx;
}
