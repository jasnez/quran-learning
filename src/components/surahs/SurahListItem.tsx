"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import type { SurahSummary } from "@/types/quran";
import { AYAH_FORMS, formatCount } from "@/lib/format";
import { commonSurahName } from "@/lib/quran/surahNames";
import { useProgressStore } from "@/store/progressStore";

export function SurahListItem({ surah }: { surah: SurahSummary }) {
  const progress = useProgressStore((s) => s.surahProgressMap[surah.surahNumber]);
  const totalAyahs = surah.ayahCount;
  const percent =
    totalAyahs > 0 && progress ? Math.round((progress.ayahsListened.size / totalAyahs) * 100) : 0;
  const isCompleted = percent >= 100;
  const isInProgress = percent >= 1 && percent < 100;
  const commonName = commonSurahName(surah);

  return (
    // No prefetch: scrolling the list would download all 114 surahs (QA section 6).
    <Link
      href={`/surah/${surah.surahNumber}`}
      prefetch={false}
      className="group flex min-h-[4rem] flex-col rounded-xl border border-line bg-surface transition-colors hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text"
    >
      <div className="flex min-h-[4rem] items-center gap-3 px-4 py-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-sunken text-sm font-medium text-ink-muted"
          aria-hidden
        >
          {surah.surahNumber}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-ink">
            {surah.nameLatin}
          </p>
          <p className="text-xs text-ink-muted">
            {commonName ? `${commonName} · ` : ""}{formatCount(surah.ayahCount, AYAH_FORMS)}
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          {isCompleted && (
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-wash text-accent-text"
            >
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
              <span className="sr-only">Završeno</span>
            </span>
          )}
          {isInProgress && (
            <span className="text-xs tabular-nums text-ink-muted">
              {percent}%
              <span className="sr-only"> preslušano</span>
            </span>
          )}
          <span
            className="text-right text-xl font-medium text-ink"
            dir="rtl"
            lang="ar"
          >
            {surah.nameArabic}
          </span>
        </div>
      </div>
      {isInProgress && (
        <div
          className="h-0.5 overflow-hidden rounded-b-xl bg-surface-sunken"
          aria-hidden
        >
          <div
            className="h-full rounded-b-xl bg-accent"
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
    </Link>
  );
}
