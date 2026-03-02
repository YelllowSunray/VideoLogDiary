"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";

const MAX_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export function VideoRecorder({
  onRecordingComplete,
  onCancel,
}: {
  onRecordingComplete: (blob: Blob) => void;
  onCancel: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const maxDurationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elapsedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [status, setStatus] = useState<"loading" | "ready" | "recording" | "stopped">("loading");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    let stream: MediaStream | null = null;
    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: "user", width: 1280, height: 720 },
        audio: true,
      })
      .then((s) => {
        stream = s;
        streamRef.current = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
        setStatus("ready");
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Could not access camera/microphone");
        setStatus("ready");
      });
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, []);

  const startRecording = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;
    setError(null);
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
      ? "video/webm;codecs=vp9,opus"
      : "video/webm";
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 2_500_000 });
    mediaRecorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      if (chunksRef.current.length > 0) {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        onRecordingComplete(blob);
      }
    };

    recorder.start(1000);
    setStatus("recording");
    setElapsed(0);

    const startTime = Date.now();
    elapsedIntervalRef.current = setInterval(() => {
      const secs = Math.floor((Date.now() - startTime) / 1000);
      setElapsed(secs);
    }, 1000);

    maxDurationTimerRef.current = setTimeout(() => {
      if (elapsedIntervalRef.current) {
        clearInterval(elapsedIntervalRef.current);
        elapsedIntervalRef.current = null;
      }
      stopRecording();
    }, MAX_DURATION_MS);
  }, [onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }
    if (elapsedIntervalRef.current) {
      clearInterval(elapsedIntervalRef.current);
      elapsedIntervalRef.current = null;
    }
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setStatus("stopped");
  }, []);

  const handleCancel = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    onCancel();
  }, [onCancel]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-video w-full max-w-2xl overflow-hidden rounded-xl bg-zinc-900">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="h-full w-full object-cover"
        />
        {status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 text-zinc-400">
            Opening camera…
          </div>
        )}
        {status === "ready" && (
          <div className="absolute bottom-3 left-3 rounded-lg bg-black/50 px-2 py-1 text-xs text-zinc-300">
            Preview — press Start recording when ready
          </div>
        )}
        {status === "recording" && (
          <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-black/70 px-3 py-1.5 text-sm text-red-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            {formatTime(elapsed)} / 5:00
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {status === "loading" && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Requesting camera access…
          </p>
        )}
        {(status === "ready" || status === "loading") && (
          <>
            <button
              type="button"
              onClick={startRecording}
              disabled={status === "loading"}
              className="rounded-full bg-rose-500 px-6 py-2.5 font-medium text-white transition hover:bg-rose-600 disabled:opacity-50"
            >
              Start recording
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={status === "loading"}
              className="rounded-full border border-zinc-300 px-6 py-2.5 font-medium transition hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
          </>
        )}
        {status === "recording" && (
          <button
            type="button"
            onClick={stopRecording}
            className="rounded-full bg-rose-500 px-6 py-2.5 font-medium text-white transition hover:bg-rose-600"
          >
            Stop recording
          </button>
        )}
        {status === "stopped" && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Processing…
          </p>
        )}
      </div>
    </div>
  );
}
