"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useDiary } from "@/contexts/DiaryContext";
import { useAuth } from "@/contexts/AuthContext";
import { getDaysWithEntries } from "@/lib/streak";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getMonthDays(year: number, month: number): { date: string; isCurrentMonth: boolean }[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = first.getDay();
  const daysInMonth = last.getDate();
  const total = startPad + daysInMonth;
  const rows = Math.ceil(total / 7) * 7;
  const out: { date: string; isCurrentMonth: boolean }[] = [];
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  for (let i = 0; i < startPad; i++) {
    const d = new Date(year, month, 1 - (startPad - i));
    out.push({ date: iso(d), isCurrentMonth: false });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    out.push({ date: iso(new Date(year, month, i)), isCurrentMonth: true });
  }
  const remaining = rows - out.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month, daysInMonth + i);
    out.push({ date: iso(d), isCurrentMonth: false });
  }
  return out;
}

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const { entries, loading } = useDiary();
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const daysWithEntries = useMemo(() => new Set(getDaysWithEntries(entries)), [entries]);
  const monthDays = useMemo(
    () => getMonthDays(viewDate.year, viewDate.month),
    [viewDate.year, viewDate.month]
  );

  const prevMonth = () => {
    setViewDate((v) =>
      v.month === 0 ? { year: v.year - 1, month: 11 } : { year: v.year, month: v.month - 1 }
    );
  };
  const nextMonth = () => {
    setViewDate((v) =>
      v.month === 11 ? { year: v.year + 1, month: 0 } : { year: v.year, month: v.month + 1 }
    );
  };

  const today = new Date().toISOString().slice(0, 10);

  if (authLoading || !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-zinc-500">{user ? "Loading…" : "Please sign in."}</p>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        History
      </h1>
      <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
        Days with an entry are filled in. Click a day to see that day’s entries.
      </p>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={prevMonth}
            className="rounded-full p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            aria-label="Previous month"
          >
            ←
          </button>
          <span className="font-heading font-semibold text-zinc-900 dark:text-zinc-100">
            {MONTHS[viewDate.month]} {viewDate.year}
          </span>
          <button
            type="button"
            onClick={nextMonth}
            className="rounded-full p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            aria-label="Next month"
          >
            →
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-1">
          {monthDays.map(({ date, isCurrentMonth }) => {
            const hasEntry = daysWithEntries.has(date);
            const isToday = date === today;
            return (
              <Link
                key={date}
                href={hasEntry ? `/diary?date=${date}` : "/diary"}
                className={`flex aspect-square items-center justify-center rounded-lg text-sm transition ${
                  !isCurrentMonth
                    ? "text-zinc-300 dark:text-zinc-600"
                    : hasEntry
                      ? "bg-rose-500 font-medium text-white hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-500"
                      : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                } ${isToday && isCurrentMonth ? "ring-2 ring-rose-400 ring-offset-2 dark:ring-offset-zinc-900" : ""}`}
              >
                {new Date(date + "T12:00:00").getDate()}
              </Link>
            );
          })}
        </div>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-zinc-500">Loading entries…</p>
      ) : (
        <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">
          {daysWithEntries.size} day{daysWithEntries.size !== 1 ? "s" : ""} with entries
        </p>
      )}
    </main>
  );
}
