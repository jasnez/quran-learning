"use client";

import { useMemo, useSyncExternalStore } from "react";
import { computeOverallProgress, useProgressStore } from "@/store/progressStore";
import { useShallow } from "zustand/react/shallow";
import { formatNumber, formatTimeAgo } from "@/lib/format";
import { formatListeningTime } from "@/lib/formatListeningTime";
import { ButtonLink } from "@/components/ui";
import surahsData from "@/data/surahs.json";
import type { SurahSummary } from "@/types/quran";

const TOTAL_AYAHS_QURAN = 6236;

// SSR vraća false, klijent uvijek true → komponenta prikaže placeholder na SSR-u,
// pa puni sadržaj nakon hidracije. Izbjegava hydration mismatch za progress data.
const subscribeMount = () => () => {};
const getMounted = () => true;
const getMountedServer = () => false;

export function ContinueLearningSection() {
  const mounted = useSyncExternalStore(subscribeMount, getMounted, getMountedServer);

  const lastSurahNumber = useProgressStore((s) => s.lastSurahNumber);
  const lastAyahNumber = useProgressStore((s) => s.lastAyahNumber);
  const lastMode = useProgressStore((s) => s.lastMode);
  const storedSurahName = useProgressStore((s) => s.lastSurahNameLatin ?? "");
  // The stored name is the one current when the position was saved; show today's name instead.
  const lastSurahName =
    (surahsData as SurahSummary[]).find((s) => s.surahNumber === lastSurahNumber)?.nameLatin ?? storedSurahName;
  const timestamp = useProgressStore((s) => s.timestamp ?? "");
  const totalListeningTimeMs = useProgressStore((s) => s.totalListeningTimeMs);
  const surahsVisited = useProgressStore((s) => s.surahsVisited);
  const ayahsListened = useProgressStore((s) => s.ayahsListened);

  const pos = useMemo(
    () =>
      lastSurahNumber >= 1
        ? { surahNumber: lastSurahNumber, ayahNumber: lastAyahNumber, mode: lastMode }
        : null,
    [lastSurahNumber, lastAyahNumber, lastMode]
  );
  const stats = useMemo(
    () => ({
      totalTime: totalListeningTimeMs,
      surahsCount: Array.isArray(surahsVisited) ? surahsVisited.length : 0,
      ayahsCount: ayahsListened,
    }),
    [totalListeningTimeMs, surahsVisited, ayahsListened]
  );

  const hasPosition = pos !== null && pos.surahNumber >= 1;
  const readerHref = hasPosition ? `/surah/${pos.surahNumber}?ayah=${pos.ayahNumber}` : "/surah/1";
  const learnHref = hasPosition ? `/learn/${pos.surahNumber}?ayah=${pos.ayahNumber}` : "/learn/1";
  const timeLabel = timestamp ? formatTimeAgo(timestamp) : "";
  const showStats = stats.totalTime > 0 || stats.surahsCount > 0 || stats.ayahsCount > 0;
  const overall = useProgressStore(useShallow((s) => computeOverallProgress(s.surahProgressMap)));
  const showOverallStats =
    overall.totalSurahsStarted > 0 ||
    overall.totalAyahsListened > 0 ||
    overall.totalAyahsRead > 0 ||
    stats.totalTime > 0;

  if (!mounted) {
    return (
      <section aria-labelledby="continue-heading" className="space-y-6">
        <div className="rounded-xl border border-stone-200 bg-stone-50/80 px-5 py-4 dark:border-stone-700 dark:bg-stone-900/40">
          <p className="text-base font-medium text-stone-800 dark:text-stone-200">
            Dobar početak su kratke sure ispod.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="continue-heading" className="space-y-6">
      {hasPosition ? (
        <div
          className="relative overflow-hidden rounded-xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/90 to-stone-50 px-5 py-5 dark:border-emerald-800/40 dark:from-emerald-950/40 dark:to-stone-900/60 md:px-7 md:py-6"
          data-testid="continue-learning-card"
        >
          <div className="relative">
            <h2
              id="continue-heading"
              className="text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100 md:text-xl"
            >
              Nastavi učenje
            </h2>
            <p className="mt-1 text-base text-stone-700 dark:text-stone-300">
              {lastSurahName}, {pos!.ayahNumber}. ajet
            </p>
            <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
              {pos!.mode === "reader" ? "Čitanje" : "Učenje"}
              {timeLabel ? `, ${timeLabel}` : ""}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <ButtonLink href={readerHref} variant="primary" size="sm">
                Nastavi čitanje
              </ButtonLink>
              <ButtonLink href={learnHref} variant="secondary" size="sm">
                Uči ajet po ajet
              </ButtonLink>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-stone-200 bg-stone-50/80 px-5 py-4 dark:border-stone-700 dark:bg-stone-900/40">
          <p className="text-base font-medium text-stone-800 dark:text-stone-200">
            Dobar početak su kratke sure ispod.
          </p>
        </div>
      )}

      {showStats && !showOverallStats && (
        <div
          className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-500 dark:text-stone-400"
          data-testid="progress-stats-row"
        >
          <span>Otvorene sure: {formatNumber(stats.surahsCount)}</span>
          <span aria-hidden>·</span>
          <span>Preslušani ajeti: {formatNumber(stats.ayahsCount)}</span>
          <span aria-hidden>·</span>
          <span>Slušanje: {formatListeningTime(stats.totalTime)}</span>
        </div>
      )}

      {showOverallStats && mounted && (
        <div
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          data-testid="overall-stats-cards"
        >
          <div className="rounded-xl border border-stone-200/80 bg-white px-4 py-3 dark:border-stone-700/80 dark:bg-stone-900/40">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
              Započete sure
            </p>
            <p className="mt-0.5 text-lg font-semibold text-stone-800 dark:text-stone-200">
              {formatNumber(overall.totalSurahsStarted)}
            </p>
          </div>
          <div className="rounded-xl border border-stone-200/80 bg-white px-4 py-3 dark:border-stone-700/80 dark:bg-stone-900/40">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
              Preslušani ajeti
            </p>
            <p className="mt-0.5 text-lg font-semibold text-stone-800 dark:text-stone-200">
              {formatNumber(overall.totalAyahsListened)}
            </p>
          </div>
          <div className="rounded-xl border border-stone-200/80 bg-white px-4 py-3 dark:border-stone-700/80 dark:bg-stone-900/40">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
              Vrijeme slušanja
            </p>
            <p className="mt-0.5 text-lg font-semibold text-stone-800 dark:text-stone-200">
              {formatListeningTime(stats.totalTime)}
            </p>
          </div>
          <div className="rounded-xl border border-stone-200/80 bg-white px-4 py-3 dark:border-stone-700/80 dark:bg-stone-900/40">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
              {"Od cijelog Kur'ana"}
            </p>
            <p className="mt-0.5 text-lg font-semibold text-stone-800 dark:text-stone-200">
              {formatNumber(overall.totalAyahsListened)} od {formatNumber(TOTAL_AYAHS_QURAN)} ajeta
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
