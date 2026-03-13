"use client";

import Link from "next/link";
import type { JuzInfo } from "@/types/quran";
import { getJuzProgress } from "@/lib/data/juzUtils";
import { useProgressStore } from "@/store/progressStore";
import type { SurahSummary } from "@/types/quran";

type JuzListCardProps = {
  juz: JuzInfo;
  allSurahs: SurahSummary[];
};

function getRangeLabel(juz: JuzInfo, allSurahs: SurahSummary[]): string {
  const startName = allSurahs.find((s) => s.surahNumber === juz.startSurah)?.nameLatin ?? `Sura ${juz.startSurah}`;
  const endName = allSurahs.find((s) => s.surahNumber === juz.endSurah)?.nameLatin ?? `Sura ${juz.endSurah}`;
  return `${startName} ${juz.startSurah}:${juz.startAyah} — ${endName} ${juz.endSurah}:${juz.endAyah}`;
}

export function JuzListCard({ juz, allSurahs }: JuzListCardProps) {
  const getSurahProgress = useProgressStore((s) => s.getSurahProgress);
  const progress = getJuzProgress(juz.juz, getSurahProgress, allSurahs);
  const rangeLabel = getRangeLabel(juz, allSurahs);
  const surahCount = juz.surahsIncluded.length;

  return (
    <Link
      href={`/juz/${juz.juz}`}
      className="group flex min-h-[4rem] flex-col rounded-xl border border-amber-200/80 bg-white transition-colors hover:bg-amber-50/80 focus:outline-none focus:ring-2 focus:ring-amber-500/30 dark:border-amber-800/50 dark:bg-stone-900/50 dark:hover:bg-amber-950/30"
    >
      <div className="flex min-h-[4rem] items-center gap-4 px-4 py-4">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-sm font-medium text-amber-800 dark:bg-amber-900/50 dark:text-amber-200"
          aria-hidden
        >
          {juz.juz}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-stone-900 dark:text-stone-100">
            Džuz {juz.juz} · {juz.name}
          </p>
          <p className="text-sm text-stone-500 dark:text-stone-400" dir="rtl" lang="ar">
            {juz.nameArabic}
          </p>
          <p className="mt-0.5 text-xs text-stone-400 dark:text-stone-500">
            {rangeLabel}
          </p>
          <p className="mt-0.5 text-xs text-stone-400 dark:text-stone-500">
            {surahCount} {surahCount === 1 ? "sura" : "sure"}
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          {progress.percent >= 1 && (
            <span className="text-xs text-stone-500 dark:text-stone-400" aria-label={`${progress.percent}% preslušano`}>
              {progress.percent}%
            </span>
          )}
          <span className="text-right text-lg font-medium text-stone-700 dark:text-stone-300" dir="rtl" lang="ar">
            {juz.nameArabic}
          </span>
        </div>
      </div>
      {progress.percent >= 1 && progress.percent < 100 && (
        <div className="h-0.5 overflow-hidden rounded-b-xl bg-stone-100 dark:bg-stone-800" aria-hidden>
          <div
            className="h-full rounded-b-xl bg-amber-400 dark:bg-amber-600"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      )}
    </Link>
  );
}
