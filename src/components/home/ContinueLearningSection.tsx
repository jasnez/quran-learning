"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useProgressStore } from "@/store/progressStore";
import { timeSince } from "@/lib/timeSince";

export function ContinueLearningSection() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const pos = useProgressStore((s) => (typeof s.getLastPosition === "function" ? s.getLastPosition() : null));
  const lastSurahNameLatin = useProgressStore((s) => s.lastSurahNameLatin ?? "");
  const timestamp = useProgressStore((s) => s.timestamp ?? "");
  const stats = useProgressStore((s) => (typeof s.getStats === "function" ? s.getStats() : { totalTime: 0, surahsCount: 0, ayahsCount: 0 }));

  const hasPosition = pos !== null && pos.surahNumber >= 1;
  const readerHref = hasPosition ? `/surah/${pos.surahNumber}?ayah=${pos.ayahNumber}` : "/surah/1";
  const learnHref = hasPosition ? `/learn/${pos.surahNumber}` : "/learn/1";
  const timeLabel = timestamp ? timeSince(timestamp) : "";
  const showStats = stats.totalTime > 0 || stats.surahsCount > 0 || stats.ayahsCount > 0;
  const totalMinutes = Math.floor(stats.totalTime / 60000);

  if (!mounted) {
    return (
      <section aria-labelledby="continue-heading" className="space-y-6">
        <div className="rounded-xl border border-stone-200 bg-stone-50/80 px-5 py-4 dark:border-stone-700 dark:bg-stone-900/40">
          <p className="text-base font-medium text-stone-800 dark:text-stone-200">
            Dobrodošli! Počnite sa kratkim surama.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="continue-heading" className="space-y-6">
      {hasPosition ? (
        <div
          className="relative overflow-hidden rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50/90 to-stone-50 px-5 py-6 dark:border-emerald-800/60 dark:from-emerald-950/40 dark:to-stone-900/60 md:px-8 md:py-8"
          data-testid="continue-learning-card"
        >
          <div className="absolute right-0 top-0 h-24 w-32 bg-gradient-to-bl from-emerald-100/50 to-transparent dark:from-emerald-900/20" aria-hidden />
          <div className="relative">
            <h2
              id="continue-heading"
              className="text-xl font-semibold text-stone-900 dark:text-stone-100 md:text-2xl"
            >
              Nastavi učenje
            </h2>
            <p className="mt-1 text-base text-stone-700 dark:text-stone-300">
              {lastSurahNameLatin} · Ajet {pos!.ayahNumber}
            </p>
            <p className="mt-0.5 text-sm text-stone-500 dark:text-stone-400">
              Mod: {pos!.mode === "reader" ? "Reader" : "Learning"}
            </p>
            {timeLabel && (
              <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
                Zadnji put: {timeLabel}
              </p>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={readerHref}
                className="inline-flex h-11 items-center justify-center rounded-full bg-emerald-700 px-5 text-sm font-medium text-white transition-colors hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500"
              >
                Nastavi u Reader-u
              </Link>
              <Link
                href={learnHref}
                className="inline-flex h-11 items-center justify-center rounded-full border-2 border-emerald-600 bg-transparent px-5 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
              >
                Nastavi u Learning modu
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-stone-200 bg-stone-50/80 px-5 py-4 dark:border-stone-700 dark:bg-stone-900/40">
          <p className="text-base font-medium text-stone-800 dark:text-stone-200">
            Dobrodošli! Počnite sa kratkim surama.
          </p>
        </div>
      )}

      {showStats && (
        <div
          className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-500 dark:text-stone-400"
          data-testid="progress-stats-row"
        >
          <span>{stats.surahsCount} sura posjećeno</span>
          <span aria-hidden>·</span>
          <span>{stats.ayahsCount} ajeta preslušano</span>
          <span aria-hidden>·</span>
          <span>{totalMinutes} min ukupno slušanje</span>
        </div>
      )}
    </section>
  );
}
