"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { SurahSummary } from "@/types/quran";
import { useProgressStore } from "@/store/progressStore";
import { formatListeningTime } from "@/lib/formatListeningTime";

const TOTAL_AYAHS_QURAN = 6236;

type FilterKind = "sve" | "zapocete" | "zavrsene" | "nepocete";
type SortKind = "surah" | "progress" | "lastAccessed";

export function ProgressContent({ surahs }: { surahs: SurahSummary[] }) {
  const [filter, setFilter] = useState<FilterKind>("sve");
  const [sort, setSort] = useState<SortKind>("surah");

  const overall = useProgressStore((s) => s.getOverallProgress());
  const progressMap = useProgressStore((s) => s.surahProgressMap);
  const totalTimeMs = useProgressStore((s) => s.totalListeningTimeMs);

  const filteredAndSorted = useMemo(() => {
    let list = surahs.map((s) => {
      const p = progressMap[s.surahNumber];
      const total = s.ayahCount;
      const listened = p?.ayahsListened.size ?? 0;
      const percent = total > 0 ? Math.round((listened / total) * 100) : 0;
      return { surah: s, progress: p, percent, listened, total, lastAccessed: p?.lastAccessedAt ?? "" };
    });

    if (filter === "zapocete") list = list.filter((x) => x.percent > 0 && x.percent < 100);
    else if (filter === "zavrsene") list = list.filter((x) => x.percent >= 100);
    else if (filter === "nepocete") list = list.filter((x) => x.percent === 0);

    if (sort === "progress") list = [...list].sort((a, b) => b.percent - a.percent);
    else if (sort === "lastAccessed")
      list = [...list].sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime());
    else list = [...list].sort((a, b) => a.surah.surahNumber - b.surah.surahNumber);

    return list;
  }, [surahs, progressMap, filter, sort]);

  const hasAnyProgress =
    overall.totalSurahsStarted > 0 ||
    overall.totalAyahsListened > 0 ||
    overall.totalAyahsRead > 0;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 md:text-3xl">
        Napredak
      </h1>

      {hasAnyProgress && (
        <section aria-labelledby="progress-overall-heading" className="space-y-4">
          <h2 id="progress-overall-heading" className="sr-only">
            Ukupna statistika
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-stone-200/80 bg-white px-4 py-4 dark:border-stone-700/80 dark:bg-stone-900/40">
              <p className="text-xs font-medium uppercase tracking-wide text-stone-400 dark:text-stone-500">
                Sure započeto
              </p>
              <p className="mt-1 text-2xl font-semibold text-stone-800 dark:text-stone-200">
                {overall.totalSurahsStarted}
              </p>
            </div>
            <div className="rounded-xl border border-stone-200/80 bg-white px-4 py-4 dark:border-stone-700/80 dark:bg-stone-900/40">
              <p className="text-xs font-medium uppercase tracking-wide text-stone-400 dark:text-stone-500">
                Ajeta preslušano
              </p>
              <p className="mt-1 text-2xl font-semibold text-stone-800 dark:text-stone-200">
                {overall.totalAyahsListened}
              </p>
            </div>
            <div className="rounded-xl border border-stone-200/80 bg-white px-4 py-4 dark:border-stone-700/80 dark:bg-stone-900/40">
              <p className="text-xs font-medium uppercase tracking-wide text-stone-400 dark:text-stone-500">
                Ukupno slušanje
              </p>
              <p className="mt-1 text-2xl font-semibold text-stone-800 dark:text-stone-200">
                {formatListeningTime(totalTimeMs)}
              </p>
            </div>
            <div className="rounded-xl border border-stone-200/80 bg-white px-4 py-4 dark:border-stone-700/80 dark:bg-stone-900/40">
              <p className="text-xs font-medium uppercase tracking-wide text-stone-400 dark:text-stone-500">
                Napredak
              </p>
              <p className="mt-1 text-2xl font-semibold text-stone-800 dark:text-stone-200">
                {overall.totalAyahsListened}/{TOTAL_AYAHS_QURAN}
              </p>
            </div>
          </div>
        </section>
      )}

      <section aria-labelledby="progress-filters-heading" className="space-y-4">
        <h2 id="progress-filters-heading" className="text-lg font-medium text-stone-900 dark:text-stone-100">
          Sure
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-stone-500 dark:text-stone-400">Filter:</span>
          <div className="flex flex-wrap gap-2">
            {(["sve", "zapocete", "zavrsene", "nepocete"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  filter === f
                    ? "bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900"
                    : "bg-stone-100 text-stone-700 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
                }`}
              >
                {f === "sve" && "Sve"}
                {f === "zapocete" && "Započete"}
                {f === "zavrsene" && "Završene"}
                {f === "nepocete" && "Nepočete"}
              </button>
            ))}
          </div>
          <span className="ml-2 text-sm text-stone-500 dark:text-stone-400">Sortiraj:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKind)}
            className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-800 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200"
            aria-label="Sortiraj po"
          >
            <option value="surah">Redoslijed sura</option>
            <option value="progress">Po napretku %</option>
            <option value="lastAccessed">Zadnji pristup</option>
          </select>
        </div>

        <ul className="space-y-3" role="list">
          {filteredAndSorted.map(({ surah, percent, listened, total }) => (
            <li key={surah.id}>
              <Link
                href={`/surah/${surah.surahNumber}`}
                className="flex flex-col rounded-xl border border-stone-200/80 bg-white transition-colors hover:bg-stone-50 dark:border-stone-700/80 dark:bg-stone-900/50 dark:hover:bg-stone-800/50"
              >
                <div className="flex min-h-[3.5rem] items-center gap-4 px-4 py-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-sm font-medium text-stone-600 dark:bg-stone-700 dark:text-stone-400">
                    {surah.surahNumber}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-stone-900 dark:text-stone-100">{surah.nameLatin}</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {listened}/{total} ajeta · {percent}%
                    </p>
                  </div>
                  {percent >= 100 && (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                      Završeno
                    </span>
                  )}
                  {percent >= 1 && percent < 100 && (
                    <span className="text-sm text-stone-500 dark:text-stone-400">{percent}%</span>
                  )}
                </div>
                {percent >= 1 && percent < 100 && (
                  <div className="h-0.5 overflow-hidden rounded-b-xl bg-stone-100 dark:bg-stone-800">
                    <div
                      className="h-full bg-amber-200 dark:bg-amber-800/60"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
