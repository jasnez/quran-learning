"use client";

import { useState, useMemo } from "react";
import type { JuzInfo } from "@/types/quran";
import type { JuzSegment } from "@/lib/data";
import { useSettingsStore } from "@/store/settingsStore";
import { usePlayerStore } from "@/store/playerStore";
import { useTajwidNotice } from "@/components/quran/useTajwidNotice";
import { Button, EndNav } from "@/components/ui";
import { AyahUnit } from "./AyahUnit";
import { SurahFrame } from "./SurahFrame";
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
  // The colors are seen here; their legend is in the settings sheet.
  useTajwidNotice();

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
    <div>
      <ul className="list-none space-y-10" role="list">
        {bySegment.map(({ segment, ayahs }) => (
          <li key={segment.surah.surahNumber}>
            <SurahFrame surah={segment.surah} variant="segment" />
            <div className="mt-5">
              {ayahs.map((ayah) => (
                <AyahUnit
                  key={ayah.id}
                  ayah={ayah}
                  queueAyahs={juzAyahs}
                  queueSource="juz"
                  surahNameLatin={segment.surah.nameLatin}
                  arabicFontSize={arabicFontSize}
                  showTransliteration={showTransliteration}
                  showTranslation={showTranslation}
                  showTajwidColors={showTajwidColors}
                />
              ))}
            </div>
          </li>
        ))}
      </ul>

      {hasMore && (
        <div className="flex justify-center py-6">
          <Button variant="secondary" onClick={loadMore}>
            Učitaj još
          </Button>
        </div>
      )}

      <EndNav
        label="Susjedni džuzevi"
        prev={
          juz.juz > 1
            ? { href: `/juz/${juz.juz - 1}`, kicker: "Prethodni džuz", title: `Džuz ${juz.juz - 1}` }
            : undefined
        }
        next={
          juz.juz < 30
            ? { href: `/juz/${juz.juz + 1}`, kicker: "Sljedeći džuz", title: `Džuz ${juz.juz + 1}` }
            : undefined
        }
        all={{ href: "/surahs?view=juz", label: "Svi džuzevi" }}
      />
    </div>
  );
}
