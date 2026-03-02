"use client";

import { DiaryHeader } from "@/components/DiaryHeader";
import { DiaryProvider } from "@/contexts/DiaryContext";
import { ProfileProvider } from "@/contexts/ProfileContext";

export default function DiaryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProfileProvider>
      <DiaryProvider>
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
          <DiaryHeader />
          {children}
        </div>
      </DiaryProvider>
    </ProfileProvider>
  );
}
