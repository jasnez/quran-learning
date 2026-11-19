"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { JuzInfo } from "@/types/quran";
import { commonSurahName } from "@/lib/quran/surahNames";
import type { JuzSegment } from "@/lib/data";
import { useSettingsStore } from "@/store/settingsStore";
import { usePlayerStore } from "@/store/playerStore";
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

  // Playback runs through the whole juz, across surah boundaries.
  const juzAyahs = useMemo(() => segments.flatMap((s) => s.ayahs), [segments]);
  const totalAyahs = juzAyahs.length;

  const [loadedCount, setLoadedCount] = useState(AYAHS_PER_PAGE);
  // Keep the ayah that is playing rendered when playback runs past the loaded page.
  const currentAyahId = usePlayerStore((s) => s.currentAyahId);
  const playingIndex = juzAyahs.findIndex((a) => a.id === currentAyahId);
  const visibleCount = Math.max(loadedCount, playingIndex + 1);
  const hasMore = visibleCount < totalAyahs;
  const loadMore = () => setLoadedCount(Math.min(visibleCount + AYAHS_PER_PAGE, totalAyahs));

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
        className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4 text-sm"
        aria-label="Navigacija džuzeva"
      >
        <div>
          {juz.juz > 1 ? (
            <Link
              href={`/juz/${juz.juz - 1}`}
              className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-ink hover:bg-surface-sunken"
            >
              Džuz {juz.juz - 1}
            </Link>
          ) : null}
        </div>
        <div>
          {juz.juz < 30 ? (
            <Link
              href={`/juz/${juz.juz + 1}`}
              className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-on-accent hover:bg-accent-hover"
            >
              Džuz {juz.juz + 1}
            </Link>
          ) : null}
        </div>
      </nav>

      <ul className="space-y-14 list-none" role="list">
        {bySegment.map(({ segment, ayahs }) => (
          <li key={segment.surah.surahNumber}>
            <div className="mb-6 rounded-xl border border-line bg-highlight px-4 py-3">
              <p className="font-arabic text-2xl font-normal text-ink" dir="rtl" lang="ar">
                {segment.surah.nameArabic}
              </p>
              <p className="mt-1 text-sm text-ink-muted">
                {segment.surah.nameLatin}
                {commonSurahName(segment.surah) && (
                  <>
                    <span className="mx-2 text-ink-muted">·</span>
                    {commonSurahName(segment.surah)}
                  </>
                )}
              </p>
            </div>
            {ayahs.map((ayah) => (
              <div key={ayah.id} className="mb-10">
                <AyahCard
                  ayah={ayah}
                  queueAyahs={juzAyahs}
                  queueSource="juz"
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
            className="rounded-full border border-line bg-surface px-6 py-3 text-sm font-medium text-ink hover:bg-surface-sunken"
          >
            Učitaj još
          </button>
        </div>
      )}
    </div>
  );
}
