import type { DiaryEntry } from "./types";

/** Unique dates (YYYY-MM-DD) that have at least one entry, sorted newest first */
export function getDaysWithEntries(entries: DiaryEntry[]): string[] {
  const set = new Set(entries.map((e) => e.date));
  return Array.from(set).sort((a, b) => b.localeCompare(a));
}

/** Consecutive days with entries ending on today or the most recent entry date */
export function getStreak(entries: DiaryEntry[]): number {
  const days = getDaysWithEntries(entries);
  if (days.length === 0) return 0;

  const today = new Date().toISOString().slice(0, 10);
  const sorted = [...days].sort(); // oldest to newest

  // If the most recent entry isn't today or yesterday, streak is 0
  const mostRecent = sorted[sorted.length - 1];
  const todayTime = new Date(today).getTime();
  const mostRecentTime = new Date(mostRecent).getTime();
  const diffDays = (todayTime - mostRecentTime) / (1000 * 60 * 60 * 24);
  if (diffDays > 1) return 0;

  // Count backwards from most recent
  let streak = 0;
  let check = new Date(mostRecent);
  const daySet = new Set(days);

  while (true) {
    const d = check.toISOString().slice(0, 10);
    if (!daySet.has(d)) break;
    streak++;
    check.setDate(check.getDate() - 1);
  }
  return streak;
}
