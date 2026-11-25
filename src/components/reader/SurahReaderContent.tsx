"use client";

import { Suspense, useEffect, useRef } from "react";
import Link from "next/link";
import type { Ayah } from "@/types/quran";
import { useSettingsStore } from "@/store/settingsStore";
import { usePlayerStore } from "@/store/playerStore";
import { useChapterTimestamps } from "@/lib/audio/useChapterTimestamps";
import { getJuzForAyah } from "@/lib/data/juzUtils";
import { useTajwidNotice } from "@/components/quran/useTajwidNotice";
import { AyahUnit } from "./AyahUnit";
import { useActiveAyahObserver } from "./useActiveAyahObserver";
import { SurahReaderUrlEffects } from "./SurahReaderUrlEffects";
import { preferredScrollBehavior } from "@/lib/scrollBehavior";

type SurahReaderContentProps = { ayahs: Ayah[]; initialAyahNumber?: number; surahNameLatin: string; initialAutoplay?: boolean };

export function SurahReaderContent({
  ayahs,
  initialAyahNumber,
  surahNameLatin,
  initialAutoplay,
}: SurahReaderContentProps) {
  const arabicFontSize = useSettingsStore((s) => s.arabicFontSize);
  const showTransliteration = useSettingsStore((s) => s.showTransliteration);
  const showTranslation = useSettingsStore((s) => s.showTranslation);
  const showTajwidColors = useSettingsStore((s) => s.showTajwidColors);
  // No playback clock here: every card would re-render on each frame (QA P1-9). AyahUnit reads it.
  const currentAyahId = usePlayerStore((s) => s.currentAyahId);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const wordByWordMode = usePlayerStore((s) => s.wordByWordMode);

  const prevAyahIdRef = useRef<string | null>(null);
  // The ayah on screen, for the header's counter and the desktop ayah list.
  useActiveAyahObserver(ayahs);
  // The colors are seen here; their legend is in the settings sheet.
  useTajwidNotice();

  const surahNumber = ayahs.length > 0 ? parseInt(ayahs[0].id.split(":")[0], 10) : 0;

  const { byVerse: verseTimestamps, error: chapterDataError } = useChapterTimestamps(
    surahNumber,
    wordByWordMode,
  );

  // Scroll active ayah into view only when transitioning between ayahs (not on mount or manual scroll)
  useEffect(() => {
    if (!currentAyahId || !isPlaying) return;
    const prev = prevAyahIdRef.current;
    prevAyahIdRef.current = currentAyahId;
    if (prev !== null && prev !== currentAyahId) {
      const el = document.querySelector(`[data-ayah-id="${currentAyahId}"]`);
      if (el && typeof el.scrollIntoView === "function") {
        el.scrollIntoView({ behavior: preferredScrollBehavior(), block: "center" });
      }
    }
  }, [currentAyahId, isPlaying]);

  if (ayahs.length === 0) {
    return (
      <div className="py-12 text-center" data-empty-state>
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface-sunken text-ink-muted" data-empty-icon aria-hidden>
          <BookIcon />
        </span>
        <p className="mt-4 text-ink-muted">
          Sura se nije učitala. Osvježi stranicu.
        </p>
      </div>
    );
  }

  const wordDataFailed = wordByWordMode && chapterDataError;

  return (
    <>
      {/* Own boundary: useSearchParams must not take the surah text out of the static HTML (P1-6). */}
      <Suspense fallback={null}>
        <SurahReaderUrlEffects
          ayahs={ayahs}
          surahNameLatin={surahNameLatin}
          initialAyahNumber={initialAyahNumber}
          initialAutoplay={initialAutoplay}
        />
      </Suspense>
      {/* The status region stays in the DOM and only its text changes: a region mounted together
          with its text is often not announced. Empty, it is sr-only, so no empty box shows. */}
      <p className={wordDataFailed ? "mb-4 text-sm text-warning-text" : "sr-only"} role="status">
        {wordDataFailed ? "Praćenje riječi se nije učitalo. Provjeri internet i pokušaj ponovo." : null}
      </p>
      <ul className="list-none" role="list">
        {ayahs.map((ayah, index) => {
          const prevAyah = index > 0 ? ayahs[index - 1] : null;
          const [prevSurahNum, prevAyahNum] = prevAyah ? prevAyah.id.split(":").map(Number) : [0, 0];
          const [surahNum, ayahNum] = ayah.id.split(":").map(Number);
          const prevJuz = prevAyah ? getJuzForAyah(prevSurahNum!, prevAyahNum!) : undefined;
          const currentJuz = getJuzForAyah(surahNum!, ayahNum!);
          const showJuzDivider = prevAyah != null && prevJuz != null && currentJuz != null && prevJuz !== currentJuz;
          const showPageBadge =
            ayah.page > 0 && (!prevAyah || prevAyah.page !== ayah.page);

          return (
            <li key={ayah.id}>
              {showJuzDivider && (
                <div className="flex items-center gap-3 py-6">
                  <span className="h-px flex-1 bg-line" aria-hidden />
                  <Link
                    href={`/juz/${currentJuz}`}
                    className="rounded-full border border-line-strong bg-surface px-4 py-1.5 text-sm font-medium text-ink hover:bg-surface-sunken"
                  >
                    Džuz {currentJuz}
                  </Link>
                  <span className="h-px flex-1 bg-line" aria-hidden />
                </div>
              )}
              <AyahUnit
                ayah={ayah}
                queueAyahs={ayahs}
                surahNameLatin={surahNameLatin}
                arabicFontSize={arabicFontSize}
                showTransliteration={showTransliteration}
                showTranslation={showTranslation}
                showTajwidColors={showTajwidColors}
                wordByWord={wordByWordMode && !chapterDataError}
                wordTimestamps={verseTimestamps?.get(ayah.id)}
                showPageBadge={showPageBadge}
              />
            </li>
          );
        })}
      </ul>
    </>
  );
}

function BookIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M8 7h8" />
      <path d="M8 11h8" />
    </svg>
  );
}
