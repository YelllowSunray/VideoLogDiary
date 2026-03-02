const THUMBNAIL_TIMEOUT_MS = 12_000; // skip thumbnail after 12s to avoid getting stuck

function captureFrame(video: HTMLVideoElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) {
      reject(new Error("Video has no dimensions"));
      return;
    }
    const width = 320;
    const height = (h / w) * width;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Canvas 2d context not available"));
      return;
    }
    ctx.drawImage(video, 0, 0, width, height);
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Failed to create thumbnail blob"))),
      "image/jpeg",
      0.85
    );
  });
}

/**
 * Generates a JPEG thumbnail from a video Blob (e.g. from MediaRecorder).
 * Captures a frame at ~1 second, or the first available frame for short clips.
 * Times out after 12s so the app never gets stuck on "Preparing thumbnail..."
 * Call from client only (uses video element and canvas).
 */
export function generateThumbnailFromVideoBlob(videoBlob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(videoBlob);
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";

    let settled = false;
    let fallbackId: ReturnType<typeof setTimeout> | null = null;
    const cleanup = () => {
      video.remove();
      URL.revokeObjectURL(url);
    };
    const timeoutId = setTimeout(() => {
      fail(new Error("Thumbnail generation timed out"));
    }, THUMBNAIL_TIMEOUT_MS);

    const finish = (blob: Blob) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      if (fallbackId) clearTimeout(fallbackId);
      cleanup();
      resolve(blob);
    };
    const fail = (err: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      if (fallbackId) clearTimeout(fallbackId);
      cleanup();
      reject(err);
    };

    video.onerror = () => fail(new Error("Failed to load video for thumbnail"));

    const tryCapture = () => {
      captureFrame(video).then(finish).catch(fail);
    };

    video.onseeked = tryCapture;

    const startSeek = () => {
      const duration = video.duration;
      const seekTime = Number.isFinite(duration) && duration > 0
        ? Math.min(1, duration * 0.1)
        : 0;
      video.currentTime = seekTime;
    };

    video.onloadeddata = startSeek;

    video.onloadedmetadata = () => {
      if (video.readyState >= 2) startSeek();
    };

    video.oncanplay = () => {
      if (video.currentTime === 0 && !settled) {
        video.currentTime = Math.min(1, video.duration * 0.1 || 0);
      }
    };

    video.src = url;

    fallbackId = setTimeout(() => {
      if (!settled && video.readyState >= 2) {
        tryCapture();
      }
    }, 3000);
  });
}
