"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/ProfileContext";
import { getProfile, updateProfile, type UserProfile } from "@/lib/profile";

const DEBOUNCE_MS = 600;

export default function ProfilePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { reloadProfile } = useProfile();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<"saved" | "error" | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nameDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    getProfile().then((p) => {
      setProfile(p);
      setDisplayName(p.displayName);
      setSelfiePreview(p.selfieUrl);
      setLoading(false);
    });
  }, [user]);

  const showSaved = useCallback(() => {
    setMessage("saved");
    const t = setTimeout(() => setMessage(null), 2000);
    return () => clearTimeout(t);
  }, []);

  const saveName = useCallback(
    async (name: string) => {
      if (!user) return;
      setSaving(true);
      setMessage(null);
      try {
        const updated = await updateProfile({ displayName: name.trim() || "" });
        setProfile(updated);
        setDisplayName(updated.displayName);
        await reloadProfile();
        showSaved();
      } catch {
        setMessage("error");
      } finally {
        setSaving(false);
      }
    },
    [user, showSaved, reloadProfile]
  );

  useEffect(() => {
    if (!user || !profile) return;
    if (nameDebounceRef.current) clearTimeout(nameDebounceRef.current);
    nameDebounceRef.current = setTimeout(() => {
      nameDebounceRef.current = null;
      const trimmed = displayName.trim();
      if (trimmed !== profile.displayName || (!trimmed && profile.displayName)) {
        saveName(trimmed);
      }
    }, DEBOUNCE_MS);
    return () => {
      if (nameDebounceRef.current) clearTimeout(nameDebounceRef.current);
    };
  }, [displayName, user, profile, saveName]);

  const saveSelfie = useCallback(
    async (fileOrBlob: File | Blob) => {
      if (!user) return;
      setSaving(true);
      setMessage(null);
      try {
        const updated = await updateProfile({ selfieFile: fileOrBlob });
        setProfile(updated);
        setSelfiePreview(updated.selfieUrl);
        await reloadProfile();
        showSaved();
      } catch {
        setMessage("error");
      } finally {
        setSaving(false);
      }
    },
    [user, showSaved, reloadProfile]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setSelfiePreview(URL.createObjectURL(file));
    saveSelfie(file);
    e.target.value = "";
  };

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 640 },
      });
      streamRef.current = stream;
      setCameraOpen(true);
      await new Promise((r) => setTimeout(r, 100));
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setMessage("error");
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOpen(false);
  }, []);

  const captureSelfie = useCallback(() => {
    const video = videoRef.current;
    if (!video || !streamRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        stopCamera();
        setSelfiePreview(URL.createObjectURL(blob));
        saveSelfie(blob);
      },
      "image/jpeg",
      0.9
    );
  }, [stopCamera, saveSelfie]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  if (authLoading || !user) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-zinc-500">
          {authLoading ? "Loading…" : "Please sign in to view your profile."}
        </p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-zinc-500">Loading profile…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/diary"
        className="mb-6 inline-block text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        ← Back to diary
      </Link>

      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        Profile
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Your name and selfie are saved automatically.
      </p>

      <div className="mt-8 space-y-8">
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Name
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-zinc-900 placeholder-zinc-400 focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-400 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Selfie
          </label>
          <div className="mt-2 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <div className="flex h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-zinc-200 bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800">
              {selfiePreview ? (
                <img
                  src={selfiePreview}
                  alt="Your selfie"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl text-zinc-400 dark:text-zinc-500">
                  👤
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Upload photo
              </button>
              <button
                type="button"
                onClick={cameraOpen ? undefined : startCamera}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Take selfie
              </button>
            </div>
          </div>
        </div>

        {(message || saving) && (
          <p
            className={`text-sm font-medium ${
              message === "saved"
                ? "text-green-600 dark:text-green-400"
                : message === "error"
                  ? "text-red-600 dark:text-red-400"
                  : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            {saving ? "Saving…" : message === "saved" ? "Saved." : "Something went wrong. Try again."}
          </p>
        )}

        <div className="border-t border-zinc-200 pt-8 dark:border-zinc-700">
          <button
            type="button"
            onClick={() => signOut()}
            className="rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Sign out
          </button>
        </div>
      </div>

      {cameraOpen && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 px-4">
          <p className="mb-4 text-white">Position your face and click Capture</p>
          <div className="relative aspect-square w-full max-w-sm overflow-hidden rounded-2xl bg-zinc-900">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover mirror"
              style={{ transform: "scaleX(-1)" }}
            />
          </div>
          <div className="mt-6 flex gap-4">
            <button
              type="button"
              onClick={captureSelfie}
              className="rounded-full bg-rose-500 px-8 py-3 font-medium text-white hover:bg-rose-600"
            >
              Capture
            </button>
            <button
              type="button"
              onClick={stopCamera}
              className="rounded-full border border-white/50 px-8 py-3 font-medium text-white hover:bg-white/10"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
