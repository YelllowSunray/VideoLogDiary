"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
/* Mood/tags — uncomment to re-enable: import { updateEntryMeta } from "@/lib/diary"; */
import type { DiaryEntry } from "@/lib/types";

/* const MOOD_OPTIONS = ["😊", "😐", "😢", "🎉", "💪", "🤔", "😴", "❤️"]; */

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const q = query.trim().toLowerCase();
  const i = text.toLowerCase().indexOf(q);
  if (i === -1) return text;
  return (
    <>
      {i > 0 ? `${text.slice(0, i)}` : ""}
      <mark className="rounded bg-amber-200 dark:bg-amber-600/50">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

function getSearchSnippet(transcript: string, query: string, maxLen = 100): string {
  if (!query.trim()) return transcript.slice(0, maxLen) + (transcript.length > maxLen ? "…" : "");
  const q = query.trim().toLowerCase();
  const i = transcript.toLowerCase().indexOf(q);
  if (i === -1) return transcript.slice(0, maxLen) + "…";
  const start = Math.max(0, i - 30);
  const end = Math.min(transcript.length, i + q.length + 50);
  const snippet = (start > 0 ? "…" : "") + transcript.slice(start, end) + (end < transcript.length ? "…" : "");
  return snippet;
}

export function DiaryEntryCard({
  entry,
  searchQuery = "",
  onRetryTranscription,
  onUpdateEntry,
  onExportEntry,
}: {
  entry: DiaryEntry;
  searchQuery?: string;
  onRetryTranscription?: (entry: DiaryEntry) => void;
  onUpdateEntry?: () => void;
  onExportEntry?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [retrying, setRetrying] = useState(false);
  /* const [tagInput, setTagInput] = useState(""); */
  const dateFormatted = entry.createdAt
    ? new Date(entry.createdAt).toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : new Date(entry.date + "T12:00:00").toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });

  const previewText = useMemo(() => {
    if (entry.status === "done" && entry.transcript) {
      return searchQuery.trim() ? getSearchSnippet(entry.transcript, searchQuery) : `${entry.transcript.slice(0, 80)}…`;
    }
    if (entry.status === "transcribing") return "Transcribing…";
    if (entry.status === "uploading") return "Uploading…";
    if (entry.status === "error") return entry.errorMessage ?? "Error";
    return "—";
  }, [entry, searchQuery]);

  const transcriptWithHighlight = useMemo((): React.ReactNode => {
    if (!entry.transcript) return "";
    if (!searchQuery.trim()) return entry.transcript;
    return highlightMatch(entry.transcript, searchQuery);
  }, [entry.transcript, searchQuery]);

  return (
    <article className="diary-card-playful group rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-start gap-3 text-left transition-opacity hover:opacity-95"
      >
        <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-zinc-200 transition-transform duration-200 group-hover:scale-[1.02] dark:bg-zinc-700">
          {entry.thumbnailUrl ? (
            <img
              src={entry.thumbnailUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-2xl text-zinc-400 dark:text-zinc-500" aria-hidden>
              ▶
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <time className="font-medium text-zinc-900 dark:text-zinc-100">
              {dateFormatted}
            </time>
            {/* Mood/tags display — uncomment to re-enable
            {entry.mood && <span className="text-lg">{entry.mood}</span>}
            {(entry.tags?.length ?? 0) > 0 && (
              <span className="flex flex-wrap gap-1">
                {entry.tags!.map((t) => (
                  <span
                    key={t}
                    className="rounded bg-zinc-200 px-1.5 py-0.5 text-xs dark:bg-zinc-700"
                  >
                    {t}
                  </span>
                ))}
              </span>
            )}
            */}
          </div>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {entry.status === "done" && entry.transcript && searchQuery.trim()
              ? highlightMatch(getSearchSnippet(entry.transcript, searchQuery, 120), searchQuery)
              : previewText}
          </p>
        </div>
        <span className={`shrink-0 self-center text-zinc-400 transition-transform duration-300 ease-out ${expanded ? "rotate-90" : ""}`} aria-hidden>
          ▶
        </span>
      </button>
      {expanded && (
        <div className="mt-4 space-y-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/diary/entry/${entry.id}`}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium dark:border-zinc-600 dark:bg-zinc-800"
            >
              View full page
            </Link>
            {onExportEntry && (entry.transcript || entry.status === "done") && (
              <button
                type="button"
                onClick={onExportEntry}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium dark:border-zinc-600 dark:bg-zinc-800"
              >
                Export transcript
              </button>
            )}
          </div>
          {/* Mood selector — uncomment to re-enable
          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Mood:</span>
            {MOOD_OPTIONS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={async () => {
                  await updateEntryMeta(entry.id, { mood: entry.mood === m ? "" : m });
                  onUpdateEntry?.();
                }}
                className={`rounded-full p-1.5 text-lg transition ${
                  entry.mood === m
                    ? "bg-rose-100 dark:bg-rose-900/40"
                    : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
                title="Set mood"
              >
                {m}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Tags:</span>
            <input
              type="text"
              placeholder="Add tag…"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key !== "Enter" || !tagInput.trim()) return;
                e.preventDefault();
                const tag = tagInput.trim().toLowerCase();
                const next = [...(entry.tags ?? []), tag].filter((t, i, a) => a.indexOf(t) === i);
                await updateEntryMeta(entry.id, { tags: next });
                setTagInput("");
                onUpdateEntry?.();
              }}
              className="w-28 rounded border border-zinc-200 bg-white px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800"
            />
            {(entry.tags ?? []).map((t) => (
              <span key={t} className="flex items-center gap-1 rounded-full bg-zinc-200 px-2 py-0.5 text-xs dark:bg-zinc-700">
                {t}
                <button
                  type="button"
                  onClick={async () => {
                    const next = (entry.tags ?? []).filter((x) => x !== t);
                    await updateEntryMeta(entry.id, { tags: next.length ? next : undefined });
                    onUpdateEntry?.();
                  }}
                  className="ml-0.5 hover:opacity-70"
                  aria-label={`Remove ${t}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          */}
          {entry.videoUrl && (
            <video
              src={entry.videoUrl}
              controls
              className="w-full rounded-lg bg-black"
            />
          )}
          {entry.status === "error" && entry.videoUrl && onRetryTranscription && (
            <button
              type="button"
              disabled={retrying}
              onClick={async () => {
                setRetrying(true);
                try {
                  await onRetryTranscription(entry);
                } finally {
                  setRetrying(false);
                }
              }}
              className="rounded-lg bg-rose-100 px-3 py-2 text-sm font-medium text-rose-800 hover:bg-rose-200 disabled:opacity-50 dark:bg-rose-900/30 dark:text-rose-200 dark:hover:bg-rose-900/50"
            >
              {retrying ? "Transcribing…" : "Retry transcription"}
            </button>
          )}
          {entry.transcript && (
            <div className="rounded-lg bg-zinc-50 p-3 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {transcriptWithHighlight}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
