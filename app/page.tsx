"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { LandingPage } from "@/components/LandingPage";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 px-4 dark:bg-zinc-950">
        <h1 className="font-display text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Welcome to YourVideoLog
        </h1>
        <Link
          href="/diary"
          className="rounded-full bg-rose-500 px-8 py-3 font-medium text-white transition hover:scale-105 hover:bg-rose-600 active:scale-100"
        >
          Open diary
        </Link>
      </div>
    );
  }

  return <LandingPage />;
}
