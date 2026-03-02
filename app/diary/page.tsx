"use client";

import React, { useMemo, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useDiary } from "@/contexts/DiaryContext";
import { VideoRecorder } from "@/components/VideoRecorder";
import { DiaryEntryCard } from "@/components/DiaryEntryCard";
import {
  createDiaryEntry,
  getTodayDateString,
  updateEntryTranscript,
  setEntryError,
} from "@/lib/diary";
import { generateThumbnailFromVideoBlob } from "@/lib/thumbnail";
import type { DiaryEntry } from "@/lib/types";

function exportEntryTranscript(entry: DiaryEntry) {
  const date = new Date(entry.date).toLocaleDateString("en-US", { dateStyle: "long" });
  const text = `YourVideoLog — ${date}\n\n${entry.transcript ?? "(No transcript)"}`;
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `diary-${entry.date}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function matchSearch(entry: DiaryEntry, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  const transcript = (entry.transcript ?? "").toLowerCase();
  return transcript.includes(q);
}

function DiaryPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dateFilter = searchParams.get("date") ?? "";
  const { user, loading: authLoading } = useAuth();
  const { entries, loading, reloadEntries } = useDiary();
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [transcribePercent, setTranscribePercent] = useState(0);
  const [progressPhase, setProgressPhase] = useState<"idle" | "preparing" | "uploading" | "transcribing">("idle");
  const [searchQuery, setSearchQuery] = useState("");
  /* Mood/tag filters — uncomment to re-enable
  const [tagFilter, setTagFilter] = useState("");
  const [moodFilter, setMoodFilter] = useState("");
  const allTags = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => e.tags?.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [entries]);
  const allMoods = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => e.mood && set.add(e.mood));
    return Array.from(set);
  }, [entries]);
  */

  const today = getTodayDateString();
  const hasEntryToday = entries.some((e) => e.date === today);

  const filteredEntries = useMemo(() => {
    let list = entries;
    if (dateFilter) list = list.filter((e) => e.date === dateFilter);
    if (searchQuery.trim()) list = list.filter((e) => matchSearch(e, searchQuery));
    /* if (tagFilter) list = list.filter((e) => e.tags?.includes(tagFilter));
    if (moodFilter) list = list.filter((e) => e.mood === moodFilter); */
    return list;
  }, [entries, dateFilter, searchQuery]);

  const runTranscribe = useCallback(
    async (entry: DiaryEntry, onProgress?: (percent: number) => void) => {
      if (!entry.videoUrl) return;
      const start = Date.now();
      const durationMs = 90_000; // simulate progress over 90s max
      const interval = setInterval(() => {
        const elapsed = Date.now() - start;
        const pct = Math.min(90, (elapsed / durationMs) * 90);
        onProgress?.(pct);
      }, 500);
      try {
        const res = await fetch("/api/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoUrl: entry.videoUrl, entryId: entry.id }),
        });
        const data = await res.json();
        if (!res.ok) {
          await setEntryError(entry.id, data.error ?? "Transcription failed");
        } else {
          await updateEntryTranscript(entry.id, data.transcript ?? "");
        }
        onProgress?.(100);
        await reloadEntries();
      } finally {
        clearInterval(interval);
      }
    },
    [reloadEntries]
  );

  const handleRecordingComplete = useCallback(
    async (blob: Blob) => {
      if (!user) return;
      if (blob.size === 0) {
        setUploadError("Recording was empty. Please try again.");
        return;
      }
      setUploadError(null);
      setUploading(true);
      setProgressPhase("preparing");
      setUploadPercent(0);
      setTranscribePercent(0);
      try {
        setRecording(false);
        let thumbnailBlob: Blob | undefined;
        try {
          thumbnailBlob = await generateThumbnailFromVideoBlob(blob);
        } catch {
          // Continue without thumbnail if generation fails
        }
        setProgressPhase("uploading");
        const entry = await createDiaryEntry(today, blob, thumbnailBlob, (pct) => setUploadPercent(pct));
        await reloadEntries();
        if (dateFilter && dateFilter !== today) {
          router.replace("/diary");
        }
        setProgressPhase("transcribing");
        setTranscribePercent(0);
        await runTranscribe(entry, (pct) => setTranscribePercent(pct));
      } catch (err) {
        console.error(err);
        const message = err instanceof Error ? err.message : "Upload or save failed. Try again.";
        setUploadError(message);
        await reloadEntries();
      } finally {
        setUploading(false);
        setProgressPhase("idle");
        setUploadPercent(0);
        setTranscribePercent(0);
      }
    },
    [user, today, runTranscribe, reloadEntries, dateFilter, router]
  );

  const exportAllFiltered = useCallback(() => {
    const lines = filteredEntries.map((e) => {
      const date = new Date(e.date).toLocaleDateString("en-US", { dateStyle: "long" });
      return `--- ${date} ---\n\n${e.transcript ?? "(No transcript)"}`;
    });
    const text = lines.join("\n\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `diary-export-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredEntries]);

  if (authLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-zinc-500">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-zinc-500">Please sign in to view your diary.</p>
      </div>
    );
  }

  return (
    <main className="relative mx-auto max-w-2xl px-4 py-8">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -left-20 top-1/4 h-40 w-40 rounded-full bg-rose-100/40 blur-[80px] dark:bg-rose-950/30" style={{ animation: "float-slow 8s ease-in-out infinite" }} />
        <div className="absolute right-0 top-1/3 h-32 w-32 rounded-full bg-amber-100/30 blur-[60px] dark:bg-amber-950/20" style={{ animation: "float-slow 10s ease-in-out infinite 1s" }} />
      </div>
      {recording ? (
        <section className="animate-diary-card-in mb-8" style={{ animationDelay: "0ms" }}>
          <h2 className="font-heading mb-4 text-lg font-medium text-zinc-900 dark:text-zinc-100">
            Record today’s entry (up to 5 minutes)
          </h2>
          <VideoRecorder
            onRecordingComplete={handleRecordingComplete}
            onCancel={() => setRecording(false)}
          />
        </section>
      ) : (
        <section className="mb-8">
          {!hasEntryToday && (
            <button
              type="button"
              onClick={() => setRecording(true)}
              className="diary-btn-playful animate-diary-card-in w-full rounded-xl border-2 border-dashed border-rose-300 bg-rose-50/50 py-8 font-medium text-rose-700 hover:border-rose-400 hover:bg-rose-50 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300 dark:hover:bg-rose-950/50"
              style={{ animationDelay: "50ms" }}
            >
              <span className="font-display">Record today’s diary entry</span>
            </button>
          )}
          {hasEntryToday && (
            <button
              type="button"
              onClick={() => setRecording(true)}
              className="diary-btn-playful animate-diary-card-in w-full rounded-xl border-2 border-dashed border-rose-300 bg-rose-50/50 py-6 font-semibold text-rose-700 hover:border-rose-400 hover:bg-rose-50 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300 dark:hover:bg-rose-950/50"
              style={{ animationDelay: "50ms" }}
            >
              <span className="font-display">Record another entry for today</span>
            </button>
          )}
        </section>
      )}

      {uploading && (
        <section className="mb-8">
          <div className="animate-diary-card-in space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-900/50" style={{ animationDelay: "0ms" }}>
            {progressPhase === "preparing" && (
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                <span className="inline-block animate-[diary-dot-pulse_1.2s_ease-in-out_infinite]">Preparing thumbnail…</span>
              </p>
            )}
            {progressPhase === "uploading" && (
              <div>
                <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Uploading… {Math.round(uploadPercent)}%
                </p>
                <div className="diary-progress-bar h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                  <div
                    className="h-full rounded-full bg-rose-500 transition-[width] duration-300 ease-out"
                    style={{ width: `${uploadPercent}%` }}
                  />
                </div>
              </div>
            )}
            {progressPhase === "transcribing" && (
              <div>
                <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Transcribing… {Math.round(transcribePercent)}%
                </p>
                <div className="diary-progress-bar h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-[width] duration-300 ease-out"
                    style={{ width: `${transcribePercent}%` }}
                  />
                </div>
              </div>
            )}
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Don’t refresh the page—your entry is being saved.
            </p>
          </div>
        </section>
      )}

      {uploadError && (
        <section className="mb-6 animate-diary-card-in" style={{ animationDelay: "0ms" }}>
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-800 dark:bg-rose-950/30">
            <p className="text-sm font-medium text-rose-800 dark:text-rose-200">
              Something went wrong
            </p>
            <p className="mt-1 text-sm text-rose-700 dark:text-rose-300">{uploadError}</p>
            <button
              type="button"
              onClick={() => setUploadError(null)}
              className="mt-2 text-sm font-medium text-rose-600 underline dark:text-rose-400"
            >
              Dismiss
            </button>
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="animate-diary-card-in font-heading text-lg font-medium text-zinc-900 dark:text-zinc-100" style={{ animationDelay: "80ms" }}>
            {dateFilter ? `Entries for ${new Date(dateFilter + "T12:00:00").toLocaleDateString("en-US", { dateStyle: "long" })}` : "Past entries"}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              placeholder="Search transcripts…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="diary-input-focus w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/30 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 sm:w-48"
            />
            {/* Mood/tag filter dropdowns — uncomment to re-enable
            {allTags.length > 0 && (
              <select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="rounded-lg border border-zinc-200 bg-white px-2 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
              >
                <option value="">All tags</option>
                {allTags.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            )}
            {allMoods.length > 0 && (
              <select
                value={moodFilter}
                onChange={(e) => setMoodFilter(e.target.value)}
                className="rounded-lg border border-zinc-200 bg-white px-2 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
              >
                <option value="">All moods</option>
                {allMoods.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            )}
            */}
            {dateFilter && (
              <a href="/diary" className="diary-btn-playful whitespace-nowrap rounded-lg px-2 py-1.5 text-sm text-rose-600 transition dark:text-rose-400">
                Clear date
              </a>
            )}
            {filteredEntries.length > 0 && (
              <button
                type="button"
                onClick={exportAllFiltered}
                className="diary-btn-playful rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium transition dark:border-zinc-600 dark:bg-zinc-800"
              >
                Export all
              </button>
            )}
          </div>
        </div>
        {loading ? (
          <p className="text-sm text-zinc-500">Loading entries…</p>
        ) : filteredEntries.length === 0 ? (
          <p className="animate-diary-card-in text-sm text-zinc-500 dark:text-zinc-400" style={{ animationDelay: "120ms" }}>
            {entries.length === 0
              ? "No entries yet. Record your first diary entry above."
              : searchQuery.trim()
                ? `No entries match "${searchQuery}".`
                : dateFilter
                  ? "No entries for this day."
                  : "No entries yet."}
          </p>
        ) : (
          <>
            {searchQuery.trim() && (
              <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
                {filteredEntries.length} entr{filteredEntries.length === 1 ? "y" : "ies"} match
                &quot;{searchQuery}&quot;
              </p>
            )}
            <ul className="flex flex-col gap-4">
              {filteredEntries.map((entry, index) => (
                <li key={entry.id} className="animate-diary-card-in" style={{ animationDelay: `${100 + index * 60}ms` }}>
                  <DiaryEntryCard
                    entry={entry}
                    searchQuery={searchQuery.trim()}
                    onRetryTranscription={runTranscribe}
                    onUpdateEntry={reloadEntries}
                    onExportEntry={() => exportEntryTranscript(entry)}
                  />
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </main>
  );
}

export default function DiaryPage() {
  return (
    <Suspense fallback={
      <main className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-zinc-500">Loading…</p>
      </main>
    }>
      <DiaryPageContent />
    </Suspense>
  );
}
