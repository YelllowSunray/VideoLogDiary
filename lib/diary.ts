import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  query,
  where,
  updateDoc,
} from "firebase/firestore";
import { ref, uploadBytesResumable, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, auth } from "./firebase";
import type { DiaryEntry, DiaryEntryStatus } from "./types";

const ENTRIES_COLLECTION = "diaryEntries";

function entriesRef() {
  return collection(db(), ENTRIES_COLLECTION);
}

function uploadWithProgress(
  storageRef: ReturnType<typeof ref>,
  blob: Blob,
  contentType: string,
  onProgress?: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const task = uploadBytesResumable(storageRef, blob, { contentType });
      task.on(
        "state_changed",
        (snapshot) => {
          const total = snapshot.totalBytes;
          const pct = total > 0 ? (snapshot.bytesTransferred / total) * 100 : 0;
          onProgress?.(Math.min(100, pct));
        },
        reject,
        () => resolve()
      );
    } catch (e) {
      reject(e);
    }
  });
}

export async function createDiaryEntry(
  date: string,
  videoBlob: Blob,
  thumbnailBlob?: Blob,
  onUploadProgress?: (percent: number) => void
): Promise<DiaryEntry> {
  const user = auth().currentUser;
  if (!user) throw new Error("Not authenticated");

  const ts = Date.now();
  const entryId = `${user.uid}_${date}_${ts}`;
  const videoStoragePath = getVideoStoragePath(user.uid, date, ts);
  const entryRef = doc(db(), ENTRIES_COLLECTION, entryId);

  const totalBytes = videoBlob.size + (thumbnailBlob?.size ?? 0);
  const videoWeight = totalBytes > 0 ? videoBlob.size / totalBytes : 1;

  const storageRef = ref(storage(), videoStoragePath);
  const videoContentType = videoBlob.type || "video/webm";
  try {
    await uploadWithProgress(
      storageRef,
      videoBlob,
      videoContentType,
      (pct) => onUploadProgress?.(pct * videoWeight)
    );
  } catch (e) {
    onUploadProgress?.(0);
    await uploadBytes(storageRef, videoBlob, { contentType: videoContentType });
    onUploadProgress?.(videoWeight * 100);
  }
  const videoUrl = await getDownloadURL(storageRef);

  let thumbnailUrl: string | undefined;
  if (thumbnailBlob) {
    const thumbPath = getThumbnailStoragePath(user.uid, date, ts);
    const thumbRef = ref(storage(), thumbPath);
    try {
      await uploadWithProgress(
        thumbRef,
        thumbnailBlob,
        "image/jpeg",
        (pct) => onUploadProgress?.(videoWeight * 100 + pct * (1 - videoWeight))
      );
    } catch {
      await uploadBytes(thumbRef, thumbnailBlob, { contentType: "image/jpeg" });
    }
    thumbnailUrl = await getDownloadURL(thumbRef);
  }
  onUploadProgress?.(100);

  const entry: DiaryEntry = {
    id: entryId,
    userId: user.uid,
    date,
    videoStoragePath,
    videoUrl,
    thumbnailUrl,
    status: "transcribing",
    createdAt: Date.now(),
  };
  await setDoc(entryRef, entry);
  return { ...entry, videoUrl, thumbnailUrl };
}

export async function listDiaryEntries(): Promise<DiaryEntry[]> {
  const user = auth().currentUser;
  if (!user) return [];

  const q = query(entriesRef(), where("userId", "==", user.uid));
  const snapshot = await getDocs(q);
  const entries = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as DiaryEntry));
  entries.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  return entries;
}

export async function updateEntryTranscript(
  entryId: string,
  transcript: string,
  status: DiaryEntryStatus = "done"
): Promise<void> {
  const entryRef = doc(db(), ENTRIES_COLLECTION, entryId);
  await updateDoc(entryRef, { transcript, status });
}

export async function setEntryError(entryId: string, errorMessage: string): Promise<void> {
  const entryRef = doc(db(), ENTRIES_COLLECTION, entryId);
  await updateDoc(entryRef, { status: "error" as const, errorMessage });
}

export async function getEntryById(entryId: string): Promise<DiaryEntry | null> {
  const user = auth().currentUser;
  if (!user) return null;
  const entryRef = doc(db(), ENTRIES_COLLECTION, entryId);
  const snap = await getDoc(entryRef);
  if (!snap.exists()) return null;
  const data = snap.data() as Omit<DiaryEntry, "id">;
  if (data.userId !== user.uid) return null;
  return { id: snap.id, ...data };
}

export async function updateEntryMeta(
  entryId: string,
  updates: { mood?: string; tags?: string[] }
): Promise<void> {
  const user = auth().currentUser;
  if (!user) throw new Error("Not authenticated");
  const entryRef = doc(db(), ENTRIES_COLLECTION, entryId);
  await updateDoc(entryRef, updates);
}

export function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getVideoStoragePath(userId: string, date: string, timestamp?: number): string {
  const suffix = timestamp ?? Date.now();
  return `diary/${userId}/${date}_${suffix}.webm`;
}

export function getThumbnailStoragePath(userId: string, date: string, timestamp: number): string {
  return `diary/${userId}/${date}_${timestamp}_thumb.jpg`;
}
