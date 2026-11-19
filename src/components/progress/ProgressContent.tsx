"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import type { SurahSummary } from "@/types/quran";
import { computeOverallProgress, useProgressStore } from "@/store/progressStore";
import { useShallow } from "zustand/react/shallow";
import { formatNumber } from "@/lib/format";
import { formatListeningTime } from "@/lib/formatListeningTime";

const TOTAL_AYAHS_QURAN = 6236;

type FilterKind = "sve" | "zapocete" | "zavrsene" | "nepocete";
type SortKind = "surah" | "progress" | "lastAccessed";

export function ProgressContent({ surahs }: { surahs: SurahSummary[] }) {
  const [filter, setFilter] = useState<FilterKind>("sve");
  const [sort, setSort] = useState<SortKind>("surah");
  const sortId = useId();

  const overall = useProgressStore(useShallow((s) => computeOverallProgress(s.surahProgressMap)));
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
      <h1 className="text-2xl font-read font-bold tracking-tight text-ink md:text-3xl">
        Napredak
      </h1>

      {hasAnyProgress && (
        <section aria-labelledby="progress-overall-heading" className="space-y-4">
          <h2 id="progress-overall-heading" className="sr-only">
            Ukupno
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-line bg-surface px-4 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                Započete sure
              </p>
              <p className="mt-1 text-2xl font-semibold text-ink">
                {formatNumber(overall.totalSurahsStarted)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-surface px-4 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                Preslušani ajeti
              </p>
              <p className="mt-1 text-2xl font-semibold text-ink">
                {formatNumber(overall.totalAyahsListened)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-surface px-4 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                Vrijeme slušanja
              </p>
              <p className="mt-1 text-2xl font-semibold text-ink">
                {formatListeningTime(totalTimeMs)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-surface px-4 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                {"Od cijelog Kur'ana"}
              </p>
              <p className="mt-1 text-2xl font-semibold text-ink">
                {formatNumber(overall.totalAyahsListened)} od {formatNumber(TOTAL_AYAHS_QURAN)} ajeta
              </p>
            </div>
          </div>
        </section>
      )}

      <section aria-labelledby="progress-filters-heading" className="space-y-4">
        <h2 id="progress-filters-heading" className="text-lg font-medium text-ink">
          Sure
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-ink-muted">Filter:</span>
          <div className="flex flex-wrap gap-2">
            {(["sve", "zapocete", "zavrsene", "nepocete"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                aria-pressed={filter === f}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  filter === f
                    ? "bg-accent text-on-accent"
                    : "bg-surface-sunken text-ink hover:bg-line"
                }`}
              >
                {f === "sve" && "Sve"}
                {f === "zapocete" && "Započete"}
                {f === "zavrsene" && "Završene"}
                {f === "nepocete" && "Nezapočete"}
              </button>
            ))}
          </div>
          <label htmlFor={sortId} className="ml-2 text-sm text-ink-muted">
            Redoslijed
          </label>
          <select
            id={sortId}
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKind)}
            className="rounded-lg border border-line-strong bg-surface px-3 py-1.5 text-sm text-ink"
          >
            <option value="surah">Po redu u Kur&apos;anu</option>
            <option value="progress">Po napretku</option>
            <option value="lastAccessed">Nedavno otvorene</option>
          </select>
        </div>

        <ul className="space-y-3" role="list">
          {filteredAndSorted.map(({ surah, percent, listened, total }) => (
            <li key={surah.id}>
              <Link
                href={`/surah/${surah.surahNumber}`}
                className="flex flex-col rounded-xl border border-line bg-surface transition-colors hover:bg-surface-sunken"
              >
                <div className="flex min-h-[3.5rem] items-center gap-4 px-4 py-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-sunken text-sm font-medium text-ink-muted">
                    {surah.surahNumber}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink">{surah.nameLatin}</p>
                    <p className="text-xs text-ink-muted">
                      {formatNumber(listened)} od {formatNumber(total)} ajeta · {percent}%
                    </p>
                  </div>
                  {percent >= 100 && (
                    <span className="flex items-center gap-1 rounded-full bg-accent-wash px-2 py-0.5 text-xs font-medium text-accent-text">
                      Završeno
                    </span>
                  )}
                  {percent >= 1 && percent < 100 && (
                    <span className="text-sm text-ink-muted">{percent}%</span>
                  )}
                </div>
                {percent >= 1 && percent < 100 && (
                  <div className="h-0.5 overflow-hidden rounded-b-xl bg-surface-sunken">
                    <div
                      className="h-full bg-accent"
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
