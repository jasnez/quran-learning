"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { JuzInfo } from "@/types/quran";
import type { JuzSegment } from "@/lib/data";
import { useSettingsStore } from "@/store/settingsStore";
import { AyahCard } from "./AyahCard";
import type { Ayah } from "@/types/quran";

const AYAHS_PER_PAGE = 20;

type JuzReaderContentProps = {
  juz: JuzInfo;
  segments: JuzSegment[];
};

export function JuzReaderContent({ juz, segments }: JuzReaderContentProps) {
  const arabicFontSize = useSettingsStore((s) => s.arabicFontSize);
  const showTransliteration = useSettingsStore((s) => s.showTransliteration);
  const showTranslation = useSettingsStore((s) => s.showTranslation);
  const showTajwidColors = useSettingsStore((s) => s.showTajwidColors);

  const totalAyahs = useMemo(
    () => segments.reduce((acc, s) => acc + s.ayahs.length, 0),
    [segments]
  );

  const [visibleCount, setVisibleCount] = useState(AYAHS_PER_PAGE);
  const hasMore = visibleCount < totalAyahs;
  const loadMore = () => setVisibleCount((n) => Math.min(n + AYAHS_PER_PAGE, totalAyahs));

  let count = 0;
  const bySegment: { segment: JuzSegment; ayahs: Ayah[] }[] = [];
  for (const seg of segments) {
    const ayahs: Ayah[] = [];
    for (const ayah of seg.ayahs) {
      if (count < visibleCount) ayahs.push(ayah);
      count++;
    }
    if (ayahs.length > 0) {
      bySegment.push({ segment: seg, ayahs });
    }
  }

  return (
    <div className="flex flex-col gap-10">
      <nav
        className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--theme-border)] pb-4 text-sm"
        aria-label="Navigacija džuzeva"
      >
        <div>
          {juz.juz > 1 ? (
            <Link
              href={`/juz/${juz.juz - 1}`}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--theme-border)] px-3 py-1.5 text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              <span aria-hidden>←</span>
              Džuz {juz.juz - 1}
            </Link>
          ) : (
            <Link
              href="/surahs?view=juz"
              className="rounded-full border border-[var(--theme-border)] px-3 py-1.5 text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              Pregled džuzeva
            </Link>
          )}
        </div>
        <div>
          {juz.juz < 30 ? (
            <Link
              href={`/juz/${juz.juz + 1}`}
              className="inline-flex items-center gap-1 rounded-full bg-amber-600 px-3 py-1.5 text-white hover:bg-amber-500 dark:bg-amber-500 dark:hover:bg-amber-400"
            >
              Džuz {juz.juz + 1}
              <span aria-hidden>→</span>
            </Link>
          ) : (
            <Link
              href="/surahs?view=juz"
              className="rounded-full border border-[var(--theme-border)] px-3 py-1.5 text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              Pregled džuzeva
            </Link>
          )}
        </div>
      </nav>

      <ul className="space-y-14 list-none" role="list">
        {bySegment.map(({ segment, ayahs }) => (
          <li key={segment.surah.surahNumber}>
            <div className="mb-6 rounded-xl border border-amber-200/80 bg-amber-50/50 px-4 py-3 dark:border-amber-800/50 dark:bg-amber-950/20">
              <p className="font-arabic text-2xl font-medium text-stone-900 dark:text-stone-100" dir="rtl" lang="ar">
                {segment.surah.nameArabic}
              </p>
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                {segment.surah.nameLatin}
                {segment.surah.nameBosnian && (
                  <>
                    <span className="mx-2 text-stone-400 dark:text-stone-500">·</span>
                    {segment.surah.nameBosnian}
                  </>
                )}
              </p>
            </div>
            {ayahs.map((ayah) => (
              <div key={ayah.id} className="mb-10">
                <AyahCard
                  ayah={ayah}
                  surahAyahs={segment.ayahs}
                  surahNameLatin={segment.surah.nameLatin}
                  arabicFontSize={arabicFontSize}
                  showTransliteration={showTransliteration}
                  showTranslation={showTranslation}
                  showTajwidColors={showTajwidColors}
                />
              </div>
            ))}
          </li>
        ))}
      </ul>

      {hasMore && (
        <div className="flex justify-center py-6">
          <button
            type="button"
            onClick={loadMore}
            className="rounded-full border border-[var(--theme-border)] bg-white px-6 py-3 text-sm font-medium text-stone-700 hover:bg-stone-50 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700"
          >
            Učitaj još
          </button>
        </div>
      )}
    </div>
  );
}
