"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { useAuth } from "@/contexts/AuthContext";

const features = [
  { title: "Video entries", desc: "Record up to 5 minutes per entry. Speak naturally—your words are captured and transcribed automatically.", icon: "🎬" },
  { title: "Search your diary", desc: "Find any entry by what you said. Search across all transcripts to revisit moments and themes.", icon: "🔍" },
  { title: "Calendar history", desc: "See which days you showed up at a glance. Duolingo-style calendar keeps your streak visible.", icon: "📅" },
  { title: "Streaks", desc: "Track consecutive days so you can see your consistency and keep the habit going.", icon: "🔥" },
  /* Tags & mood — uncomment to re-enable: { title: "Tags & mood", desc: "Add tags and a quick mood to entries. Filter and look back by how you felt or what you talked about.", icon: "🏷️" }, */
  { title: "Export & share", desc: "Download transcripts anytime. Copy a link to a specific entry to revisit or share with yourself later.", icon: "📤" },
];

export function LandingPage() {
  const { signInWithGoogle } = useAuth();
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const heroTitleHighlightRef = useRef<HTMLSpanElement>(null);
  const heroSubRef = useRef<HTMLParagraphElement>(null);
  const heroCtaRef = useRef<HTMLDivElement>(null);
  const heroNoteRef = useRef<HTMLParagraphElement>(null);
  const priceCardRef = useRef<HTMLDivElement>(null);
  const featuresTitleRef = useRef<HTMLHeadingElement>(null);
  const featuresSubRef = useRef<HTMLParagraphElement>(null);
  const featureCardsRef = useRef<HTMLUListElement>(null);
  const ctaRef = useRef<HTMLElement>(null);
  const floatingDotsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(heroTitleRef.current, { opacity: 0, y: 32 }, { opacity: 1, y: 0, duration: 0.8 })
        .fromTo(heroTitleHighlightRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 }, "-=0.4")
        .fromTo(heroSubRef.current, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6 }, "-=0.2")
        .fromTo(heroCtaRef.current, { opacity: 0, y: 20, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.5 }, "-=0.2")
        .fromTo(heroNoteRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4 }, "-=0.2");

      tl.fromTo(priceCardRef.current, { opacity: 0, y: 40, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.7 }, "+=0.2");

      tl.fromTo(featuresTitleRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 }, "-=0.1")
        .fromTo(featuresSubRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4 }, "-=0.3")
        .fromTo(
          featureCardsRef.current?.children ?? [],
          { opacity: 0, y: 36 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power2.out" },
          "-=0.2"
        );

      tl.fromTo(
        ctaRef.current,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.6 },
        "+=0.1"
      );

      if (floatingDotsRef.current) {
        gsap.to(floatingDotsRef.current.children, {
          y: () => gsap.utils.random(-12, 12),
          x: () => gsap.utils.random(-8, 8),
          duration: () => gsap.utils.random(3, 5),
          repeat: -1,
          yoyo: true,
          stagger: { each: 0.3, from: "random" },
          ease: "sine.inOut",
        });
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen landing-bg">
      {/* Diary-style background: notebook lines + floating elements */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-rose-200/30 blur-[100px] dark:bg-rose-900/20" />
        <div className="absolute right-0 top-1/4 h-96 w-96 rounded-full bg-amber-200/25 blur-[120px] dark:bg-amber-900/15" />
        <div className="absolute bottom-1/4 left-1/3 h-72 w-72 rounded-full bg-rose-100/40 blur-[80px] dark:bg-rose-950/30" />
        <div ref={floatingDotsRef} className="absolute inset-0">
          <div className="absolute left-[10%] top-[18%] h-2 w-2 rounded-full bg-rose-400/50 dark:bg-rose-500/40" />
          <div className="absolute right-[12%] top-[28%] h-3 w-3 rounded-full bg-amber-300/50 dark:bg-amber-600/30" />
          <div className="absolute left-[22%] bottom-[28%] h-2 w-2 rounded-full bg-rose-300/50 dark:bg-rose-600/30" />
          <div className="absolute right-[20%] bottom-[22%] h-2.5 w-2.5 rounded-full bg-amber-200/50 dark:bg-amber-700/25" />
          <div className="absolute left-[6%] top-[55%] h-1.5 w-1.5 rounded-full bg-rose-400/40 dark:bg-rose-500/30" />
          <div className="absolute right-[10%] top-[48%] h-2 w-2 rounded-full bg-amber-400/40 dark:bg-amber-600/25" />
          <div className="absolute left-[15%] top-[75%] h-2 w-2 rounded-full bg-rose-300/35 dark:bg-rose-600/20" />
          <div className="absolute right-[18%] top-[12%] h-1.5 w-1.5 rounded-full bg-amber-300/45 dark:bg-amber-600/25" />
        </div>
      </div>

      {/* Hero — notebook lines (diary ruled paper) */}
      <section className="relative border-b border-zinc-200/60 px-4 pb-24 pt-20 dark:border-zinc-800 md:pb-32 md:pt-28 notebook-lines">
        {/* Decorative diary "date" line */}
        <div className="mx-auto max-w-4xl px-4 text-left">
          <span className="font-display text-sm uppercase tracking-widest text-zinc-400 dark:text-zinc-500">YourVideoLog</span>
        </div>
        <div className="relative mx-auto max-w-4xl text-center">
          <h1 ref={heroTitleRef} className="font-display opacity-0 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-5xl md:text-6xl lg:text-7xl">
            Your thoughts,{" "}
            <span ref={heroTitleHighlightRef} className="font-display inline-block bg-gradient-to-r from-rose-500 via-rose-400 to-amber-500 bg-clip-text text-transparent dark:from-rose-400 dark:via-rose-300 dark:to-amber-400">
              on video.
            </span>
          </h1>
          <p ref={heroSubRef} className="font-heading opacity-0 mt-6 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400 sm:text-xl">
            Record a short video log each evening. Every entry is transcribed automatically—search, reflect, and never lose a moment.
          </p>
          <div ref={heroCtaRef} className="opacity-0 mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => signInWithGoogle()}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-zinc-900 px-8 py-4 font-semibold text-white shadow-xl transition duration-300 hover:scale-105 hover:bg-zinc-800 hover:shadow-2xl active:scale-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 sm:w-auto"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.18H12v4.13h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Get started free
            </button>
          </div>
          <p ref={heroNoteRef} className="opacity-0 mt-5 text-sm text-zinc-500 dark:text-zinc-400">
            No credit card. Sign in with Google in seconds.
          </p>
        </div>
      </section>

      {/* Price — diary card with bookmark + film edge */}
      <section className="relative px-4 py-16 md:py-20">
        <div className="mx-auto max-w-4xl">
          <div
            ref={priceCardRef}
            className="diary-bookmark diary-paper film-edge diary-page-corner opacity-0 rounded-2xl border border-zinc-200/80 p-8 shadow-lg dark:border-zinc-700/80 md:p-10 hover-lift"
          >
            <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between md:gap-10">
              <div>
                <p className="text-sm font-medium uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  Always free
                </p>
                <h2 className="font-display mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100 md:text-3xl">
                  No subscription. No paywall.
                </h2>
                <p className="mt-3 text-zinc-600 dark:text-zinc-400">
                  Other journal apps charge $100/year or more. YourVideoLog is free—so you can focus on reflecting, not renewals.
                </p>
              </div>
              <div className="flex shrink-0 items-baseline gap-1 rounded-2xl bg-zinc-100 px-6 py-4 dark:bg-zinc-800 animate-gentle-pulse">
                <span className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">$0</span>
                <span className="text-zinc-500 dark:text-zinc-400">/ year</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features — diary-style cards */}
      <section className="relative px-4 py-20 md:py-28 notebook-lines">
        <div className="mx-auto max-w-5xl">
          <h2 ref={featuresTitleRef} className="font-heading opacity-0 text-center text-2xl font-bold text-zinc-900 dark:text-zinc-100 md:text-3xl">
            Everything you need to stay consistent
          </h2>
          <p ref={featuresSubRef} className="opacity-0 mx-auto mt-3 max-w-xl text-center text-zinc-600 dark:text-zinc-400">
            Built for daily reflection without the friction.
          </p>
          <ul ref={featureCardsRef} className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <li
                key={f.title}
                className="diary-paper diary-page-corner group rounded-2xl border border-zinc-200/80 p-6 dark:border-zinc-700/80 hover-lift"
              >
                <span className="inline-block text-3xl transition duration-300 group-hover:scale-110" aria-hidden>{f.icon}</span>
                <h3 className="font-heading mt-4 font-semibold text-zinc-900 dark:text-zinc-100">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{f.desc}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section ref={ctaRef} className="relative px-4 py-20 opacity-0 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold text-zinc-900 dark:text-zinc-100 md:text-4xl">
            Start YourVideoLog today
          </h2>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            Free forever. No credit card. Just sign in and record.
          </p>
          <button
            type="button"
            onClick={() => signInWithGoogle()}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-rose-500 px-8 py-4 font-semibold text-white shadow-xl transition duration-300 hover:scale-105 hover:bg-rose-600 hover:shadow-2xl active:scale-100 sm:mx-auto sm:w-auto"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.18H12v4.13h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="white" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="white" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="white" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>
        </div>
      </section>
    </div>
  );
}
