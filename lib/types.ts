export type DiaryEntryStatus = "uploading" | "transcribing" | "done" | "error";

export interface DiaryEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  videoStoragePath: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  transcript?: string;
  status: DiaryEntryStatus;
  createdAt: number;
  errorMessage?: string;
  mood?: string;   // emoji or preset id
  tags?: string[];
}
