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
import { useTajwidNotice } from "@/components/quran/useTajwidNotice";
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
  // The colors are seen here; their legend is in the settings sheet.
  useTajwidNotice();

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
    showToast(
      wasBookmarked
        ? `${ayahNumber}. ajet je uklonjen iz sačuvanih.`
        : `${ayahNumber}. ajet je sačuvan.`,
    );
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
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface-sunken text-ink-muted" data-empty-icon aria-hidden>
          <BookIcon />
        </span>
        <p className="mt-4 text-ink-muted">
          Sura se nije učitala. Osvježi stranicu.
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
  // The status regions stay in the DOM and only their text changes: a region mounted together
  // with its text is often not announced. Empty, they are sr-only, so no empty box shows.
  const wordDataFailed = wordByWordMode && chapterDataError;
  const surahFinished = !canGoNext && ayahs.length > 0;

  return (
    <>
      {/* Own boundary: useSearchParams must not take the ayah out of the static HTML (P1-6). */}
      <Suspense fallback={null}>
        <LearnModeUrlEffects ayahs={ayahs} />
      </Suspense>
      {/* Top: surah name, ayah X of Y, close/back */}
      <header className="flex flex-shrink-0 items-center justify-between gap-4 border-b border-line pb-4">
        <div className="min-w-0">
          <h1
            className="font-arabic text-xl font-normal text-ink truncate"
            dir="rtl"
            lang="ar"
          >
            {surah.nameArabic}
          </h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            {surah.nameLatin}
            {commonSurahName(surah) && (
              <>
                <span className="mx-1.5 text-ink-muted">·</span>
                {commonSurahName(surah)}
              </>
            )}
          </p>
        </div>
        <p className="flex-shrink-0 text-sm font-medium text-ink-muted" aria-live="polite">
          Ajet {currentIndex + 1} od {ayahs.length}
        </p>
        <Link
          href={`/surah/${surah.surahNumber}`}
          className="flex-shrink-0 rounded-lg p-2 text-ink-muted hover:bg-surface-sunken hover:text-ink"
          aria-label="Zatvori učenje"
        >
          <CloseIcon />
        </Link>
      </header>

      {(prevSurah || nextSurah) && (
        <nav
          className="flex flex-shrink-0 flex-wrap items-center justify-between gap-3 border-b border-line pb-4 text-sm"
          aria-label="Navigacija između sura"
        >
          <div className="flex items-center gap-2">
            {prevSurah ? (
              <Link
                href={`/learn/${prevSurah.surahNumber}`}
                className="inline-flex items-center gap-1 rounded-full border border-line-strong px-3 py-1.5 text-ink hover:bg-surface-sunken"
              >
                <span>Prethodna sura: {prevSurah.nameLatin}</span>
              </Link>
            ) : (
              <span className="rounded-full border border-line px-3 py-1.5 text-ink-muted" aria-hidden>
                Prethodna sura
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {nextSurah ? (
              <Link
                href={`/learn/${nextSurah.surahNumber}`}
                className="inline-flex items-center gap-1 rounded-full border border-accent-text bg-accent-wash px-3 py-1.5 font-medium text-accent-text hover:bg-line"
              >
                <span>Sljedeća sura: {nextSurah.nameLatin}</span>
              </Link>
            ) : (
              <span className="rounded-full border border-line px-3 py-1.5 text-ink-muted" aria-hidden>
                Sljedeća sura
              </span>
            )}
          </div>
        </nav>
      )}

      {/* Center: Arabic (very large), transliteration, translation */}
      <section className="flex flex-1 flex-col justify-center py-8" aria-label="Trenutni ajet">
        <article className="rounded-2xl border border-line bg-surface/50 px-6 py-10">
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
          <p
            className={wordDataFailed ? "mt-4 text-center text-sm text-warning-text" : "sr-only"}
            role="status"
          >
            {wordDataFailed ? "Praćenje riječi se nije učitalo. Provjeri internet i pokušaj ponovo." : null}
          </p>
          {showTransliteration && ayah.transliteration && (
            <p className="mt-8 text-center font-transliteration text-lg leading-relaxed text-ink-muted">
              {ayah.transliteration}
            </p>
          )}
          {showTranslation && ayah.translationBosnian && (
            <p className="mt-6 text-center font-read text-[1.0625rem] leading-[1.6] md:text-lg text-ink">
              {ayah.translationBosnian}
            </p>
          )}
        </article>
      </section>

      {/* Bottom controls */}
      <footer className="flex flex-shrink-0 flex-col gap-4 border-t border-line pt-6">
        <p className={surahFinished ? "text-center text-sm text-ink-muted" : "sr-only"} role="status">
          {surahFinished ? "Sura je završena. Mašallah!" : null}
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            className="rounded-xl p-3 text-ink-muted hover:bg-surface-sunken hover:text-ink disabled:opacity-40 disabled:hover:bg-transparent"
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
                ? "text-accent-text hover:bg-surface-sunken"
                : "text-ink-muted hover:bg-surface-sunken hover:text-ink"
            }`}
            aria-label={bookmarked ? "Ukloni iz sačuvanih" : "Sačuvaj ajet"}
            title={bookmarked ? "Ukloni iz sačuvanih" : "Sačuvaj ajet"}
          >
            <BookmarkIcon filled={bookmarked} />
          </button>
          <button
            type="button"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-on-accent shadow-lg hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text"
            aria-label={isThisAyahPlaying ? "Pauziraj" : "Pusti ajet"}
            onClick={handlePlayPause}
          >
            {isThisAyahPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button
            type="button"
            className="rounded-xl p-3 text-ink-muted hover:bg-surface-sunken hover:text-ink disabled:opacity-40 disabled:hover:bg-transparent"
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
            pressed={wordByWordMode}
            onClick={() => setWordByWordMode(!wordByWordMode)}
          >
            Riječ po riječ
          </OptionToggle>
          <OptionToggle
            active={repeatMode !== "off"}
            onClick={cycleRepeatMode}
          >
            Ponavljanje: {repeatMode === "off" ? "isključeno" : repeatMode === "surah" ? "sura" : "ajet"}
          </OptionToggle>
          <OptionToggle
            active={showTransliteration}
            pressed={showTransliteration}
            onClick={toggleTransliteration}
          >
            Transkripcija
          </OptionToggle>
          <OptionToggle
            active={showTranslation}
            pressed={showTranslation}
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
  "text-ink-muted hover:bg-surface-sunken";
const optionToggleActive =
  "bg-accent-wash text-accent-text hover:bg-line";

function OptionToggle({
  active,
  pressed,
  onClick,
  children,
}: {
  active: boolean;
  /** Set for a toggle with a fixed name; leave out for a button whose name carries the state. */
  pressed?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      data-active={String(active)}
      className={`${optionToggleBase} ${active ? optionToggleActive : optionToggleInactive}`}
      aria-pressed={pressed}
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
