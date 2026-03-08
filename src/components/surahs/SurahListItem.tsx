"use client";

import Link from "next/link";
import type { SurahSummary } from "@/types/quran";
import { useProgressStore } from "@/store/progressStore";

const revelationLabel: Record<string, string> = {
  meccan: "Meka",
  medinan: "Medina",
};

export function SurahListItem({ surah }: { surah: SurahSummary }) {
  const progress = useProgressStore((s) => s.getSurahProgress(surah.surahNumber));
  const totalAyahs = surah.ayahCount;
  const percent =
    totalAyahs > 0 && progress ? Math.round((progress.ayahsListened.size / totalAyahs) * 100) : 0;

  return (
    <Link
      href={`/surah/${surah.surahNumber}`}
      className="group flex min-h-[4rem] flex-col rounded-xl border border-stone-200/80 bg-white transition-colors hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 dark:border-stone-700/80 dark:bg-stone-900/50 dark:hover:bg-stone-800/50"
    >
      <div className="flex min-h-[4rem] items-center gap-4 px-4 py-4">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-sm font-medium text-stone-600 dark:bg-stone-700 dark:text-stone-400"
          aria-hidden
        >
          {surah.surahNumber}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-stone-900 dark:text-stone-100">
            {surah.nameLatin}
          </p>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {surah.nameBosnian}
          </p>
          <p className="mt-0.5 text-xs text-stone-400 dark:text-stone-500">
            {surah.ayahCount} ajeta · {revelationLabel[surah.revelationType] ?? surah.revelationType}
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          {percent >= 100 && (
            <span
              className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
              aria-label="Završeno"
            >
              <CheckIcon className="h-3.5 w-3.5" />
              Završeno
            </span>
          )}
          {percent >= 1 && percent < 100 && (
            <span
              className="text-xs text-stone-500 dark:text-stone-400"
              aria-label={`${percent}% preslušano`}
            >
              {percent}%
            </span>
          )}
          <span
            className="text-right text-lg font-medium text-stone-700 dark:text-stone-300"
            dir="rtl"
            lang="ar"
          >
            {surah.nameArabic}
          </span>
        </div>
      </div>
      {percent >= 1 && percent < 100 && (
        <div
          className="h-0.5 overflow-hidden rounded-b-xl bg-stone-100 dark:bg-stone-800"
          aria-hidden
        >
          <div
            className="h-full rounded-b-xl bg-amber-200 dark:bg-amber-800/60"
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
    </Link>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
