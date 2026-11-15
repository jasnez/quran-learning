"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Ayah } from "@/types/quran";
import { useSettingsStore } from "@/store/settingsStore";
import { usePlayerStore } from "@/store/playerStore";
import { useProgressStore } from "@/store/progressStore";
import { useChapterTimestamps } from "@/lib/audio/useChapterTimestamps";
import { playAyahFromMs } from "@/lib/audio/playFromWord";
import { getJuzForAyah } from "@/lib/data/juzUtils";
import surahsData from "@/data/surahs.json";
import { TajwidLegend } from "@/components/quran";
import { AyahCard } from "./AyahCard";
import { SurahReaderStickyHeader } from "./SurahReaderStickyHeader";
import { ReaderToolbar } from "./ReaderToolbar";

type SurahReaderContentProps = { ayahs: Ayah[]; initialAyahNumber?: number; surahNameLatin: string; initialAutoplay?: boolean };

export function SurahReaderContent({
  ayahs,
  initialAyahNumber: initialAyahNumberProp,
  surahNameLatin,
  initialAutoplay: initialAutoplayProp,
}: SurahReaderContentProps) {
  // Server page can't read searchParams in static-export build → read client-side.
  // Props (when passed by tests) take precedence over URL.
  const searchParams = useSearchParams();
  const ayahFromUrl = searchParams.get("ayah");
  const parsedUrlAyah = ayahFromUrl != null ? parseInt(ayahFromUrl, 10) : NaN;
  const initialAyahNumber =
    initialAyahNumberProp ??
    (Number.isInteger(parsedUrlAyah) && parsedUrlAyah >= 1 ? parsedUrlAyah : undefined);
  const initialAutoplay =
    initialAutoplayProp ?? searchParams.get("autoplay") === "1";

  const arabicFontSize = useSettingsStore((s) => s.arabicFontSize);
  const showTransliteration = useSettingsStore((s) => s.showTransliteration);
  const showTranslation = useSettingsStore((s) => s.showTranslation);
  const showTajwidColors = useSettingsStore((s) => s.showTajwidColors);
  const currentAyahId = usePlayerStore((s) => s.currentAyahId);
  const currentTimeMs = usePlayerStore((s) => s.currentTimeMs);
  const activeAudioSrc = usePlayerStore((s) => s.activeAudioSrc);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const wordByWordMode = usePlayerStore((s) => s.wordByWordMode);
  const setWordByWordMode = usePlayerStore((s) => s.setWordByWordMode);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const play = usePlayerStore((s) => s.play);

  const prevAyahIdRef = useRef<string | null>(null);
  const progressTrackedRef = useRef(false);

  const surahNumber = ayahs.length > 0 ? parseInt(ayahs[0].id.split(":")[0], 10) : 0;

  const { byVerse: verseTimestamps, error: chapterDataError } = useChapterTimestamps(
    surahNumber,
    wordByWordMode,
  );


  // Track surah opened and last position (lightweight: once per mount)
  useEffect(() => {
    if (ayahs.length === 0 || progressTrackedRef.current) return;
    const [surahPart] = ayahs[0].id.split(":");
    const surahNumber = parseInt(surahPart, 10) || 1;
    const ayahNumber = initialAyahNumber ?? 1;
    progressTrackedRef.current = true;
    useProgressStore.getState().addSurahVisited(surahNumber);
    useProgressStore.getState().updateLastPosition(surahNumber, ayahNumber, surahNameLatin, "reader");
  }, [ayahs, initialAyahNumber, surahNameLatin]);

  // Autoplay first ayah when navigated from "next surah" (e.g. after previous surah ended)
  useEffect(() => {
    if (!initialAutoplay || ayahs.length === 0) return;
    setQueue(ayahs);
    play(ayahs[0]);
  }, [initialAutoplay, ayahs, setQueue, play]);

  // Scroll to and briefly highlight ayah when opened from search (?ayah=N)
  useEffect(() => {
    if (initialAyahNumber == null || ayahs.length === 0) return;
    const surahId = ayahs[0].id.split(":")[0];
    const id = `${surahId}:${initialAyahNumber}`;
    const el = document.querySelector(`[data-ayah-id="${id}"]`);
    if (!el) return;
    const rafId = requestAnimationFrame(() => {
      if (typeof el.scrollIntoView === "function") {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      el.setAttribute("data-highlight-from-search", "true");
    });
    const timeoutId = setTimeout(() => {
      document.querySelector(`[data-ayah-id="${id}"]`)?.removeAttribute("data-highlight-from-search");
    }, 2000);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
    };
  }, [initialAyahNumber, ayahs]);

  // Scroll active ayah into view only when transitioning between ayahs (not on mount or manual scroll)
  useEffect(() => {
    if (!currentAyahId || !isPlaying) return;
    const prev = prevAyahIdRef.current;
    prevAyahIdRef.current = currentAyahId;
    if (prev !== null && prev !== currentAyahId) {
      const el = document.querySelector(`[data-ayah-id="${currentAyahId}"]`);
      if (el && typeof el.scrollIntoView === "function") {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [currentAyahId, isPlaying]);

  if (ayahs.length === 0) {
    return (
      <div className="py-12 text-center" data-empty-state>
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-400 dark:bg-stone-800 dark:text-stone-500" data-empty-icon aria-hidden>
          <BookIcon />
        </span>
        <p className="mt-4 text-stone-500 dark:text-stone-400">
          Podaci za ovu suru će uskoro biti dostupni.
        </p>
      </div>
    );
  }

  const currentSurahMeta = (surahsData as Array<{ surahNumber: number; nameArabic: string }>).find(
    (s) => s.surahNumber === surahNumber,
  );

  return (
    <>
      <SurahReaderStickyHeader
        surahNameLatin={surahNameLatin}
        surahNumberArabic={currentSurahMeta?.nameArabic ?? ""}
        totalAyahs={ayahs.length}
        ayahs={ayahs}
      />
      <ReaderToolbar />
      {showTajwidColors && (
        <div className="mb-6">
          <TajwidLegend />
        </div>
      )}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-3 lg:hidden">
        <span className="text-sm text-stone-600 dark:text-stone-400">
          Sinhronizacija s audioom
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={!wordByWordMode}
            onClick={() => setWordByWordMode(false)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              !wordByWordMode
                ? "bg-stone-200 text-stone-800 dark:bg-stone-600 dark:text-stone-100"
                : "text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 dark:text-stone-400"
            }`}
          >
            Po ajetu
          </button>
          <button
            type="button"
            role="switch"
            aria-checked={wordByWordMode}
            onClick={() => setWordByWordMode(true)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              wordByWordMode
                ? "bg-stone-200 text-stone-800 dark:bg-stone-600 dark:text-stone-100"
                : "text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 dark:text-stone-400"
            }`}
          >
            Riječ po riječ
          </button>
        </div>
      </div>
      {wordByWordMode && chapterDataError && (
        <p className="mb-4 text-sm text-amber-600 dark:text-amber-400" role="status">
          Podaci za označavanje riječi se nisu učitali. Provjerite vezu i pokušajte ponovo.
        </p>
      )}
      <ul className="space-y-6 list-none" role="list">
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
                <div
                  className="flex items-center gap-3 py-6"
                  role="separator"
                  aria-label={`Početak džuza ${currentJuz}`}
                >
                  <span className="h-px flex-1 bg-amber-200 dark:bg-amber-800/50" />
                  <Link
                    href={`/juz/${currentJuz}`}
                    className="rounded-full border border-amber-300 bg-amber-50 px-4 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200 dark:hover:bg-amber-900/50"
                  >
                    Džuz {currentJuz}
                  </Link>
                  <span className="h-px flex-1 bg-amber-200 dark:bg-amber-800/50" />
                </div>
              )}
              <AyahCard
                ayah={ayah}
                queueAyahs={ayahs}
                surahNameLatin={surahNameLatin}
                arabicFontSize={arabicFontSize}
                showTransliteration={showTransliteration}
                showTranslation={showTranslation}
                showTajwidColors={showTajwidColors}
                wordByWord={
                  wordByWordMode && !chapterDataError
                    ? {
                        verse: verseTimestamps?.get(ayah.id),
                        // Only the ayah whose audio is loaded shows a word; a stopped player shows none.
                        currentTimeMs: currentAyahId === ayah.id && activeAudioSrc ? currentTimeMs : -1,
                        onSeekMs: (ms) => playAyahFromMs(ayah, ayahs, ms),
                      }
                    : undefined
                }
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
