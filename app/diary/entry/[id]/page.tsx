"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getEntryById /* , updateEntryMeta */ } from "@/lib/diary";
import type { DiaryEntry } from "@/lib/types";

/* const MOOD_OPTIONS = ["😊", "😐", "😢", "🎉", "💪", "🤔", "😴", "❤️"]; */

function exportTranscript(entry: DiaryEntry) {
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

export default function EntryDetailPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const { user, loading: authLoading } = useAuth();
  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  /* const [tagInput, setTagInput] = useState(""); */

  useEffect(() => {
    if (!id || !user) {
      setLoading(false);
      return;
    }
    getEntryById(id).then((e) => {
      setEntry(e ?? null);
      setLoading(false);
    });
  }, [id, user]);

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/diary/entry/${id}` : "";

  const copyLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (authLoading || loading) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-zinc-500">Loading…</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-zinc-500">Please sign in to view this entry.</p>
      </main>
    );
  }

  if (!entry) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-zinc-500">Entry not found.</p>
        <Link href="/diary" className="mt-2 inline-block text-sm text-rose-600 dark:text-rose-400">
          Back to diary
        </Link>
      </main>
    );
  }

  const dateFormatted = entry.createdAt
    ? new Date(entry.createdAt).toLocaleString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : new Date(entry.date + "T12:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/diary"
        className="mb-4 inline-block text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        ← Back to diary
      </Link>

      <header className="mb-6">
        <time className="font-heading text-lg font-medium text-zinc-900 dark:text-zinc-100">
          {dateFormatted}
        </time>
        {/* Mood/tags — uncomment to re-enable
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Mood:</span>
          {MOOD_OPTIONS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={async () => {
                const next = entry.mood === m ? "" : m;
                await updateEntryMeta(entry.id, { mood: next });
                setEntry((e) => e ? { ...e, mood: next || undefined } : null);
              }}
              className={`rounded-full p-1.5 text-xl transition ${
                entry.mood === m ? "bg-rose-100 dark:bg-rose-900/40" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
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
              setEntry((e) => e ? { ...e, tags: next } : null);
              setTagInput("");
            }}
            className="rounded border border-zinc-200 bg-white px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800"
          />
          {(entry.tags ?? []).map((t) => (
            <span key={t} className="flex items-center gap-1 rounded-full bg-zinc-200 px-2 py-0.5 text-xs dark:bg-zinc-700">
              {t}
              <button
                type="button"
                onClick={async () => {
                  const next = (entry.tags ?? []).filter((x) => x !== t);
                  await updateEntryMeta(entry.id, { tags: next });
                  setEntry((e) => e ? { ...e, tags: next } : null);
                }}
                className="hover:opacity-70"
                aria-label={`Remove ${t}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        */}
      </header>

      {entry.videoUrl && (
        <div className="mb-6 overflow-hidden rounded-xl bg-black">
          <video
            src={entry.videoUrl}
            poster={entry.thumbnailUrl}
            controls
            className="w-full"
            playsInline
          />
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copyLink}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          {copied ? "Copied!" : "Copy link"}
        </button>
        <button
          type="button"
          onClick={() => exportTranscript(entry)}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Export transcript
        </button>
      </div>

      {entry.transcript ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <h2 className="mb-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Transcript
          </h2>
          <p className="whitespace-pre-wrap text-zinc-800 dark:text-zinc-200">
            {entry.transcript}
          </p>
        </div>
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {entry.status === "transcribing"
            ? "Transcription in progress…"
            : entry.status === "error"
              ? entry.errorMessage ?? "Transcription failed"
              : "No transcript yet."}
        </p>
      )}
    </main>
  );
}
