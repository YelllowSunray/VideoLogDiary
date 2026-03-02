"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useDiary } from "@/contexts/DiaryContext";
import { useProfile } from "@/contexts/ProfileContext";

export function DiaryHeader() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { streak } = useDiary();
  const { profile } = useProfile();

  const isHistory = pathname?.startsWith("/diary/history");

  const hasProfile = profile && (profile.displayName || profile.selfieUrl);
  const displayLabel = hasProfile && profile.displayName
    ? profile.displayName
    : user?.email ?? "";

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <Link
            href="/diary"
            className="font-rouge-script text-2xl font-normal text-zinc-900 dark:text-zinc-100"
          >
            YourVideoLog
          </Link>
          <nav className="flex gap-1">
            <Link
              href="/diary"
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                !isHistory
                  ? "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              Diary
            </Link>
            <Link
              href="/diary/history"
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                isHistory
                  ? "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              History
            </Link>
          </nav>
          {streak > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-sm font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
              🔥 {streak} day streak
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/diary/profile"
            className="flex hidden items-center gap-2 rounded-full py-1 pr-2 transition hover:bg-zinc-100 dark:hover:bg-zinc-800 sm:flex"
            title="Profile"
          >
            {hasProfile && profile.selfieUrl ? (
              <span className="flex h-8 w-8 shrink-0 overflow-hidden rounded-full border border-zinc-200 dark:border-zinc-600">
                <img
                  src={profile.selfieUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </span>
            ) : null}
            <span className="max-w-[140px] truncate text-sm text-zinc-600 dark:text-zinc-400">
              {displayLabel}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
