"use client";

import { Suspense, useEffect, useMemo } from "react";
import Link from "next/link";
import type { SurahSummary, Ayah } from "@/types/quran";
import { commonSurahName } from "@/lib/quran/surahNames";
import { usePlayerStore } from "@/store/playerStore";
import { useSettingsStore } from "@/store/settingsStore";
import { hasBookmark, useBookmarkStore } from "@/store/bookmarkStore";
import { useToastStore } from "@/store/toastStore";
import { useProgressStore } from "@/store/progressStore";
import * as audioManager from "@/lib/audio/audioManager";
import { useChapterTimestamps } from "@/lib/audio/useChapterTimestamps";
import { playAyahFromMs } from "@/lib/audio/playFromWord";
import { TajwidTextRenderer } from "@/components/quran/TajwidTextRenderer";
import { AyahWordByWord } from "@/components/quran/AyahWordByWord";
import { TajwidLegend } from "@/components/quran";
import { LearnModeUrlEffects } from "./LearnModeUrlEffects";

type SurahNavItem = { surahNumber: number; nameLatin: string; nameBosnian?: string };

type LearnModeContentProps = {
  surah: SurahSummary;
  ayahs: Ayah[];
  prevSurah?: SurahNavItem | null;
  nextSurah?: SurahNavItem | null;
};

export function LearnModeContent({ surah, ayahs, prevSurah = null, nextSurah = null }: LearnModeContentProps) {
  const arabicFontSize = useSettingsStore((s) => s.arabicFontSize);
  const showTransliteration = useSettingsStore((s) => s.showTransliteration);
  const showTranslation = useSettingsStore((s) => s.showTranslation);
  const showTajwidColors = useSettingsStore((s) => s.showTajwidColors);
  const repeatMode = useSettingsStore((s) => s.repeatMode);
  const toggleTransliteration = useSettingsStore((s) => s.toggleTransliteration);
  const toggleTranslation = useSettingsStore((s) => s.toggleTranslation);
  const cycleRepeatMode = useSettingsStore((s) => s.cycleRepeatMode);

  const currentAyahId = usePlayerStore((s) => s.currentAyahId);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const play = usePlayerStore((s) => s.play);
  const pause = usePlayerStore((s) => s.pause);
  const goToAyah = usePlayerStore((s) => s.goToAyah);
  const wordByWordMode = usePlayerStore((s) => s.wordByWordMode);
  const setWordByWordMode = usePlayerStore((s) => s.setWordByWordMode);
  const currentTimeMsStore = usePlayerStore((s) => s.currentTimeMs);
  const activeAudioSrc = usePlayerStore((s) => s.activeAudioSrc);

  const { byVerse: verseTimestamps, error: chapterDataError } = useChapterTimestamps(
    surah.surahNumber,
    wordByWordMode,
  );

  const toggleBookmark = useBookmarkStore((s) => s.toggleBookmark);
  const showToast = useToastStore((s) => s.showToast);

  const currentIndex = useMemo(() => {
    const idx = ayahs.findIndex((a) => a.id === currentAyahId);
    return idx >= 0 ? idx : 0;
  }, [ayahs, currentAyahId]);

  const ayah = ayahs[currentIndex];
  const isThisAyahPlaying = currentAyahId === ayah?.id && isPlaying;
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < ayahs.length - 1;

  const surahNumber = surah.surahNumber;
  const ayahNumber = ayah?.ayahNumber ?? 1;
  const bookmarked = useBookmarkStore((s) => hasBookmark(s.bookmarks, surahNumber, ayahNumber));

  const handleBookmark = () => {
    if (!ayah) return;
    const wasBookmarked = bookmarked;
    toggleBookmark(surahNumber, ayahNumber, surah.nameLatin, ayah.arabicText, ayah.translationBosnian);
    showToast(wasBookmarked ? "Ajet uklonjen iz označenih" : "Ajet dodan u označene");
  };

  // The ayah learn mode opens at is chosen by LearnModeUrlEffects.
  useEffect(() => {
    if (ayahs.length > 0) setQueue(ayahs, "learn");
  }, [ayahs, setQueue]);

  useEffect(() => {
    if (surah?.surahNumber) useProgressStore.getState().addSurahVisited(surah.surahNumber);
  }, [surah?.surahNumber]);

  // Only once the player points at the ayah on screen: before that the first ayah is just a
  // placeholder, e.g. while learn mode is about to open at ?ayah=N.
  useEffect(() => {
    if (!ayah || ayah.id !== currentAyahId) return;
    const progress = useProgressStore.getState();
    progress.markAyahRead(surahNumber, ayah.ayahNumber);
    // "Nastavi učenje" follows the ayah being learned (QA P2-1).
    progress.updateLastPosition(surahNumber, ayah.ayahNumber, surah.nameLatin, "learning");
  }, [ayah, currentAyahId, surahNumber, surah.nameLatin]);

  if (!ayah) {
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

  const segments =
    ayah.tajwidSegments?.length > 0
      ? ayah.tajwidSegments
      : [{ text: ayah.arabicText, rule: "normal" as const }];


  const handlePlayPause = () => {
    if (isThisAyahPlaying) pause();
    else {
      // Prime audio element on direct user gesture (mobile autoplay policies)
      const playResult = audioManager.play();
      if (playResult && typeof (playResult as Promise<void>).catch === "function") {
        void (playResult as Promise<void>).catch(() => {
          // ignore – actual source will be loaded via AudioPlayer effect
        });
      }
      setQueue(ayahs, "learn");
      play(ayah);
      useProgressStore
        .getState()
        .updateLastPosition(surahNumber, ayah.ayahNumber, surah.nameLatin, "learning");
    }
  };

  const learnFontSize = Math.max(arabicFontSize + 12, 40);

  return (
    <>
      {/* Own boundary: useSearchParams must not take the ayah out of the static HTML (P1-6). */}
      <Suspense fallback={null}>
        <LearnModeUrlEffects ayahs={ayahs} />
      </Suspense>
      {/* Top: surah name, ayah X of Y, close/back */}
      <header className="flex flex-shrink-0 items-center justify-between gap-4 border-b border-stone-200/80 pb-4 dark:border-stone-700/80">
        <div className="min-w-0">
          <h1
            className="font-arabic text-xl font-medium text-stone-800 dark:text-stone-200 truncate"
            dir="rtl"
            lang="ar"
          >
            {surah.nameArabic}
          </h1>
          <p className="mt-0.5 text-sm text-stone-500 dark:text-stone-400">
            {surah.nameLatin}
            {commonSurahName(surah) && (
              <>
                <span className="mx-1.5 text-stone-400">·</span>
                {commonSurahName(surah)}
              </>
            )}
          </p>
        </div>
        <p className="flex-shrink-0 text-sm font-medium text-stone-500 dark:text-stone-400" aria-live="polite">
          Ajet {currentIndex + 1} od {ayahs.length}
        </p>
        <Link
          href={`/surah/${surah.surahNumber}`}
          className="flex-shrink-0 rounded-lg p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-700 dark:hover:text-stone-300"
          aria-label="Zatvori režim učenja"
        >
          <CloseIcon />
        </Link>
      </header>

      {(prevSurah || nextSurah) && (
        <nav
          className="flex flex-shrink-0 flex-wrap items-center justify-between gap-3 border-b border-stone-200/80 pb-4 text-sm dark:border-stone-700/80"
          aria-label="Navigacija između sura"
        >
          <div className="flex items-center gap-2">
            {prevSurah ? (
              <Link
                href={`/learn/${prevSurah.surahNumber}`}
                className="inline-flex items-center gap-1 rounded-full border border-stone-300 px-3 py-1.5 text-stone-700 hover:bg-stone-100 dark:border-stone-600 dark:text-stone-200 dark:hover:bg-stone-800"
              >
                <span aria-hidden>←</span>
                <span>Prethodna: {prevSurah.nameLatin}</span>
              </Link>
            ) : (
              <span className="rounded-full border border-stone-200 px-3 py-1.5 text-stone-400 dark:border-stone-700 dark:text-stone-500" aria-hidden>
                Prethodna sura
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {nextSurah ? (
              <Link
                href={`/learn/${nextSurah.surahNumber}`}
                className="inline-flex items-center gap-1 rounded-full border border-emerald-600 bg-emerald-50 px-3 py-1.5 font-medium text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
              >
                <span>Sljedeća: {nextSurah.nameLatin}</span>
                <span aria-hidden>→</span>
              </Link>
            ) : (
              <span className="rounded-full border border-stone-200 px-3 py-1.5 text-stone-400 dark:border-stone-700 dark:text-stone-500" aria-hidden>
                Sljedeća sura
              </span>
            )}
          </div>
        </nav>
      )}

      {/* Center: Arabic (very large), transliteration, translation */}
      <section className="flex flex-1 flex-col justify-center py-8" aria-label="Trenutni ajet">
        <article className="rounded-2xl border border-stone-200/80 bg-white/50 px-6 py-10 dark:border-stone-700/80 dark:bg-stone-900/20">
          {wordByWordMode && !chapterDataError ? (
            <AyahWordByWord
              ayah={ayah}
              verse={verseTimestamps?.get(ayah.id)}
              currentTimeMs={currentAyahId === ayah.id && activeAudioSrc ? currentTimeMsStore : -1}
              showColors={showTajwidColors}
              onSeekMs={(ms) => playAyahFromMs(ayah, ayahs, ms, "learn")}
              className="text-center"
              style={{ fontSize: `${learnFontSize}px` }}
            />
          ) : (
            <TajwidTextRenderer
              segments={segments}
              showColors={showTajwidColors}
              className="text-center"
              style={{ fontSize: `${learnFontSize}px` }}
            />
          )}
          {wordByWordMode && chapterDataError && (
            <p className="mt-4 text-center text-sm text-amber-700 dark:text-amber-400" role="status">
              Podaci za označavanje riječi se nisu učitali. Provjerite vezu i pokušajte ponovo.
            </p>
          )}
          {showTransliteration && ayah.transliteration && (
            <p className="mt-8 text-center text-lg leading-relaxed text-stone-500 dark:text-stone-400">
              {ayah.transliteration}
            </p>
          )}
          {showTranslation && ayah.translationBosnian && (
            <p className="mt-6 text-center text-base leading-relaxed text-stone-700 dark:text-stone-300">
              {ayah.translationBosnian}
            </p>
          )}
        </article>
      </section>

      {/* Bottom controls */}
      <footer className="flex flex-shrink-0 flex-col gap-4 border-t border-stone-200/80 pt-6 dark:border-stone-700/80">
        {showTajwidColors && (
          <div className="rounded-xl border border-stone-200/80 bg-stone-50/60 dark:border-stone-700/80 dark:bg-stone-900/40">
            <TajwidLegend />
          </div>
        )}
        {!canGoNext && ayahs.length > 0 && (
          <p className="text-center text-sm text-stone-500 dark:text-stone-400" role="status">
            Završili ste ovu suru.
          </p>
        )}
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            className="rounded-xl p-3 text-stone-500 hover:bg-stone-100 hover:text-stone-700 disabled:opacity-40 disabled:hover:bg-transparent dark:hover:bg-stone-700 dark:hover:text-stone-300"
            aria-label="Prethodni ajet"
            disabled={!canGoPrev}
            // Navigation, not listening: audio starts only if it was already playing (QA P2-2).
            onClick={() => goToAyah(ayahs[currentIndex - 1])}
          >
            <PrevIcon />
          </button>
          <button
            type="button"
            onClick={handleBookmark}
            className={`rounded-xl p-3 transition-all duration-200 ease-out hover:scale-105 active:scale-95 ${
              bookmarked
                ? "text-amber-500 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/30 dark:hover:text-amber-400"
                : "text-stone-500 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-700 dark:hover:text-stone-300"
            }`}
            aria-label={bookmarked ? "Ukloni iz označenih" : "Dodaj u označene"}
            title={bookmarked ? "Ukloni iz označenih" : "Dodaj u označene"}
          >
            <BookmarkIcon filled={bookmarked} />
          </button>
          <button
            type="button"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg hover:bg-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 dark:bg-emerald-500 dark:hover:bg-emerald-400"
            aria-label={isThisAyahPlaying ? "Pauza" : "Pusti audio"}
            onClick={handlePlayPause}
          >
            {isThisAyahPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button
            type="button"
            className="rounded-xl p-3 text-stone-500 hover:bg-stone-100 hover:text-stone-700 disabled:opacity-40 disabled:hover:bg-transparent dark:hover:bg-stone-700 dark:hover:text-stone-300"
            aria-label="Sljedeći ajet"
            disabled={!canGoNext}
            onClick={() => goToAyah(ayahs[currentIndex + 1])}
          >
            <NextIcon />
          </button>
        </div>
        <div
          className="flex flex-wrap items-center justify-center gap-2"
          role="group"
          aria-label="Opcije učenja"
          data-testid="learn-options"
        >
          <OptionToggle
            active={wordByWordMode}
            ariaLabel={wordByWordMode ? "Isključi riječ po riječ" : "Uključi riječ po riječ"}
            ariaPressed={wordByWordMode}
            onClick={() => setWordByWordMode(!wordByWordMode)}
          >
            Riječ po riječ
          </OptionToggle>
          <OptionToggle
            active={repeatMode !== "off"}
            ariaLabel={
              repeatMode === "off"
                ? "Ponavljaj (prvi klik: sura, drugi klik: ajet)"
                : repeatMode === "surah"
                  ? "Ponavljanje sure. Klik za ponavljanje ajeta."
                  : "Ponavljanje ajeta. Klik za isključivanje."
            }
            ariaPressed={repeatMode !== "off"}
            onClick={cycleRepeatMode}
          >
            Ponavljaj{repeatMode !== "off" ? ` (${repeatMode === "surah" ? "sura" : "ajet"})` : ""}
          </OptionToggle>
          <OptionToggle
            active={showTransliteration}
            ariaLabel={showTransliteration ? "Sakrij transliteraciju" : "Prikaži transliteraciju"}
            ariaPressed={showTransliteration}
            onClick={toggleTransliteration}
          >
            Transliteracija
          </OptionToggle>
          <OptionToggle
            active={showTranslation}
            ariaLabel={showTranslation ? "Sakrij prijevod" : "Prikaži prijevod"}
            ariaPressed={showTranslation}
            onClick={toggleTranslation}
          >
            Prijevod
          </OptionToggle>
        </div>
      </footer>
    </>
  );
}

const optionToggleBase =
  "rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150";
const optionToggleInactive =
  "text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-700";
const optionToggleActive =
  "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-200 dark:hover:bg-emerald-900/70";

function OptionToggle({
  active,
  ariaLabel,
  ariaPressed,
  onClick,
  children,
}: {
  active: boolean;
  ariaLabel: string;
  ariaPressed: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      data-active={String(active)}
      className={`${optionToggleBase} ${active ? optionToggleActive : optionToggleInactive}`}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
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

function BookmarkIcon({ filled }: { filled?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="transition-transform duration-200"
      aria-hidden
    >
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
    </svg>
  );
}

function PrevIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function NextIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}
