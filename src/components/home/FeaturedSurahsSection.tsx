"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import type { SurahSummary } from "@/types/quran";
import { AYAH_FORMS, formatCount } from "@/lib/format";
import { useProgressStore } from "@/store/progressStore";

const DEFAULT_NUMBERS = [1, 112, 113, 114];

const subscribeMount = () => () => {};
const getMounted = () => true;
const getMountedServer = () => false;

export function FeaturedSurahsSection({ allSurahs }: { allSurahs: SurahSummary[] }) {
  const mounted = useSyncExternalStore(subscribeMount, getMounted, getMountedServer);

  const progressMap = useProgressStore((s) => s.surahProgressMap);
  const surahsVisited = useProgressStore((s) => s.surahsVisited);

  const surahsToShow = useMemo<SurahSummary[]>(() => {
    const byNumber = new Map(allSurahs.map((s) => [s.surahNumber, s]));

    if (!mounted) {
      return DEFAULT_NUMBERS.map((n) => byNumber.get(n)).filter(
        (x): x is SurahSummary => x != null,
      );
    }

    const inProgress = Object.values(progressMap ?? {})
      .filter((p) => p.completionPercent > 0 && p.completionPercent < 100)
      .sort((a, b) =>
        new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime(),
      )
      .map((p) => byNumber.get(p.surahNumber))
      .filter((x): x is SurahSummary => x != null);

    const seen = new Set<number>();
    const result: SurahSummary[] = [];

    for (const surah of inProgress) {
      if (seen.has(surah.surahNumber)) continue;
      seen.add(surah.surahNumber);
      result.push(surah);
      if (result.length >= 2) break;
    }

    for (const n of DEFAULT_NUMBERS) {
      if (result.length >= 4) break;
      if (seen.has(n)) continue;
      const surah = byNumber.get(n);
      if (surah) {
        seen.add(n);
        result.push(surah);
      }
    }

    return result;
  }, [mounted, progressMap, allSurahs]);

  const hasProgress = mounted && Array.isArray(surahsVisited) && surahsVisited.length > 0;
  const heading = hasProgress ? "Za tebe" : "Preporučene sure";
  const subheading = hasProgress
    ? "Započete sure i kratke sure za početak."
    : "Počni s kratkim surama koje se često uče.";

  return (
    <section aria-labelledby="featured-heading">
      <h2
        id="featured-heading"
        className="text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100 md:text-xl"
      >
        {heading}
      </h2>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{subheading}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {surahsToShow.map((surah) => {
          const progress = mounted ? progressMap?.[surah.surahNumber] : undefined;
          const rawPercent = progress?.completionPercent ?? 0;
          const isInProgress = rawPercent > 0 && rawPercent < 100;
          // Whole numbers, as on the progress page (QA P2-3: "14.285714285714285%").
          const percent = Math.round(rawPercent);
          return (
            <Link
              key={surah.id}
              href={`/surah/${surah.surahNumber}`}
              className="group flex flex-col rounded-xl border border-stone-200 bg-white p-4 transition-colors hover:border-emerald-200 hover:bg-stone-50/80 dark:border-stone-700 dark:bg-stone-900/50 dark:hover:border-emerald-900/50 dark:hover:bg-stone-800/50"
            >
              <span
                className="text-2xl font-medium text-stone-900 dark:text-stone-100"
                dir="rtl"
                lang="ar"
              >
                {surah.nameArabic}
              </span>
              <span className="mt-1 text-sm font-medium text-stone-700 dark:text-stone-300">
                {surah.nameLatin}
              </span>
              {isInProgress && (
                <span className="mt-2 self-start rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  Nastavi
                </span>
              )}
              <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                {isInProgress
                  ? `${percent}% preslušano · ${formatCount(surah.ayahCount, AYAH_FORMS)}`
                  : formatCount(surah.ayahCount, AYAH_FORMS)}
              </p>
              {isInProgress && (
                <div
                  className="mt-2 h-1 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800"
                  aria-hidden
                >
                  <div
                    className="h-full rounded-full bg-emerald-500 dark:bg-emerald-400"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
