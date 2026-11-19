"use client";

import Link from "next/link";
import type { JuzInfo } from "@/types/quran";
import { getJuzProgress } from "@/lib/data/juzUtils";
import { SURAH_FORMS, formatCount } from "@/lib/format";
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
  const progressMap = useProgressStore((s) => s.surahProgressMap);
  const progress = getJuzProgress(juz.juz, (n) => progressMap[n], allSurahs);
  const rangeLabel = getRangeLabel(juz, allSurahs);
  const surahCount = juz.surahsIncluded.length;

  return (
    // No prefetch: scrolling the list would download all 30 juz pages (QA section 6).
    <Link
      href={`/juz/${juz.juz}`}
      prefetch={false}
      className="group flex min-h-[4rem] flex-col rounded-xl border border-line bg-surface transition-colors hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text"
    >
      <div className="flex min-h-[4rem] items-center gap-4 px-4 py-4">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-sunken text-sm font-medium text-ink"
          aria-hidden
        >
          {juz.juz}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-ink">
            Džuz {juz.juz} · {juz.name}
          </p>
          <p className="text-sm text-ink-muted" dir="rtl" lang="ar">
            {juz.nameArabic}
          </p>
          <p className="mt-0.5 text-xs text-ink-muted">
            {rangeLabel}
          </p>
          <p className="mt-0.5 text-xs text-ink-muted">
            {formatCount(surahCount, SURAH_FORMS)}
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          {progress.percent >= 1 && (
            <span className="text-xs text-ink-muted">
              {progress.percent}%
              <span className="sr-only"> preslušano</span>
            </span>
          )}
          <span className="text-right text-lg font-medium text-ink" dir="rtl" lang="ar">
            {juz.nameArabic}
          </span>
        </div>
      </div>
      {progress.percent >= 1 && progress.percent < 100 && (
        <div className="h-0.5 overflow-hidden rounded-b-xl bg-surface-sunken" aria-hidden>
          <div
            className="h-full rounded-b-xl bg-accent"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      )}
    </Link>
  );
}
