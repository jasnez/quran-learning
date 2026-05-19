"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import type { SurahSummary } from "@/types/quran";
import { useProgressStore } from "@/store/progressStore";

export function SurahListItem({ surah }: { surah: SurahSummary }) {
  const progress = useProgressStore((s) => s.getSurahProgress(surah.surahNumber));
  const totalAyahs = surah.ayahCount;
  const percent =
    totalAyahs > 0 && progress ? Math.round((progress.ayahsListened.size / totalAyahs) * 100) : 0;
  const isCompleted = percent >= 100;
  const isInProgress = percent >= 1 && percent < 100;

  return (
    <Link
      href={`/surah/${surah.surahNumber}`}
      className="group flex min-h-[4rem] flex-col rounded-xl border border-stone-200/80 bg-white transition-colors hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 dark:border-stone-700/80 dark:bg-stone-900/50 dark:hover:bg-stone-800/50"
    >
      <div className="flex min-h-[4rem] items-center gap-3 px-4 py-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-sm font-medium text-stone-600 dark:bg-stone-700 dark:text-stone-400"
          aria-hidden
        >
          {surah.surahNumber}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-stone-900 dark:text-stone-100">
            {surah.nameLatin}
          </p>
          <p className="truncate text-xs text-stone-500 dark:text-stone-400">
            {surah.nameBosnian} · {surah.ayahCount} ajeta
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          {isCompleted && (
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
              aria-label="Završeno"
            >
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
            </span>
          )}
          {isInProgress && (
            <span
              className="text-xs tabular-nums text-stone-500 dark:text-stone-400"
              aria-label={`${percent}% preslušano`}
            >
              {percent}%
            </span>
          )}
          <span
            className="text-right text-xl font-medium text-stone-700 dark:text-stone-300"
            dir="rtl"
            lang="ar"
          >
            {surah.nameArabic}
          </span>
        </div>
      </div>
      {isInProgress && (
        <div
          className="h-0.5 overflow-hidden rounded-b-xl bg-stone-100 dark:bg-stone-800"
          aria-hidden
        >
          <div
            className="h-full rounded-b-xl bg-emerald-400 dark:bg-emerald-600"
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
    </Link>
  );
}
