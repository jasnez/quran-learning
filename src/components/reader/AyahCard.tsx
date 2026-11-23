"use client";

import { memo, useEffect, useRef } from "react";
import { Bookmark, Play, Pause } from "lucide-react";
import type { Ayah } from "@/types/quran";
import type { QueueSource } from "@/types/audio";
import { usePlayerStore } from "@/store/playerStore";
import { hasBookmark, useBookmarkStore } from "@/store/bookmarkStore";
import { useToastStore } from "@/store/toastStore";
import { useProgressStore } from "@/store/progressStore";
import type { VerseTimestamp } from "@/types/wordByWord";
import { TajwidTextRenderer } from "@/components/quran/TajwidTextRenderer";
import { AyahWordByWord } from "@/components/quran/AyahWordByWord";
import { useIsMobile } from "@/hooks/useMediaQuery";
import * as audioManager from "@/lib/audio/audioManager";
import { playAyahFromMs } from "@/lib/audio/playFromWord";

const ARABIC_MIN_MOBILE_PX = 24;
/** An ayah counts as read once its card has been in view this long without a break. */
const READ_DWELL_MS = 2000;
/** In view: at least this share of the card, or of the screen for an ayah taller than it. */
const READ_VISIBLE_SHARE = 0.5;
/** Steps at which the observer reports, so a tall card is seen filling half the screen. */
const READ_THRESHOLDS = [0, 0.25, 0.5, 0.75, 1];

type AyahCardProps = {
  ayah: Ayah;
  /** Ayahs queued when playback starts from this card (the surah in the reader, the whole juz in the juz reader). */
  queueAyahs: Ayah[];
  /** What the queue represents; decides what happens when it ends. Defaults to a whole surah. */
  queueSource?: QueueSource;
  surahNameLatin: string;
  arabicFontSize: number;
  showTransliteration: boolean;
  showTranslation: boolean;
  showTajwidColors: boolean;
  /** Word-by-word mode: show the Arabic as words and highlight the recited one. */
  wordByWord?: boolean;
  /** Word timings of this ayah for word-by-word mode; undefined while loading or unavailable. */
  wordTimestamps?: VerseTimestamp;
  /** Show a subtle page indicator badge for the first ayah on a mushaf page. */
  showPageBadge?: boolean;
};

function parseAyahId(id: string): { surahNumber: number; ayahNumber: number } {
  const [s, a] = id.split(":").map(Number);
  return { surahNumber: s ?? 1, ayahNumber: a ?? 1 };
}

/**
 * Memoized, and every player value is selected per card: while audio plays the clock changes on
 * every animation frame, and a surah has up to 286 cards (QA P1-9). Only the card whose own
 * selected values change re-renders.
 */
export const AyahCard = memo(function AyahCard({
  ayah,
  queueAyahs,
  queueSource = "surah",
  surahNameLatin,
  arabicFontSize,
  showTransliteration,
  showTranslation,
  showTajwidColors,
  wordByWord = false,
  wordTimestamps,
  showPageBadge,
}: AyahCardProps) {
  const isThisAyahPlaying = usePlayerStore((s) => s.currentAyahId === ayah.id && s.isPlaying);
  // Position in this ayah's audio file for the word highlight. Only the ayah whose audio is
  // loaded gets the clock; every other card (and a stopped player) stays at -1.
  const wordTimeMs = usePlayerStore((s) =>
    wordByWord && s.currentAyahId === ayah.id && s.activeAudioSrc ? s.currentTimeMs : -1,
  );
  const setQueue = usePlayerStore((s) => s.setQueue);
  const play = usePlayerStore((s) => s.play);
  const pause = usePlayerStore((s) => s.pause);

  const toggleBookmark = useBookmarkStore((s) => s.toggleBookmark);
  const { surahNumber, ayahNumber } = parseAyahId(ayah.id);
  const bookmarked = useBookmarkStore((s) => hasBookmark(s.bookmarks, surahNumber, ayahNumber));
  const showToast = useToastStore((s) => s.showToast);

  const isMobile = useIsMobile();
  const effectiveFontSize = isMobile ? Math.max(ARABIC_MIN_MOBILE_PX, arabicFontSize) : arabicFontSize;
  const cardRef = useRef<HTMLElement>(null);
  const hasMarkedReadRef = useRef(false);

  // Read = in view for READ_DWELL_MS without a break, so cards that scroll past (also on the
  // way to a ?ayah= target) do not count (QA P2-8).
  useEffect(() => {
    const el = cardRef.current;
    if (!el || hasMarkedReadRef.current) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const stopTimer = () => {
      if (timer !== null) clearTimeout(timer);
      timer = null;
    };
    const observer = new IntersectionObserver(
      (entries) => {
        // A busy main thread can deliver several reports for this card at once (in, then out):
        // the latest one is where the card is now.
        const entry = entries[entries.length - 1];
        if (!entry || hasMarkedReadRef.current) return;
        const screenHeight = entry.rootBounds?.height ?? window.innerHeight;
        const inView =
          entry.isIntersecting &&
          (entry.intersectionRatio >= READ_VISIBLE_SHARE ||
            entry.intersectionRect.height >= screenHeight * READ_VISIBLE_SHARE);
        if (!inView) {
          stopTimer();
          return;
        }
        timer ??= setTimeout(() => {
          timer = null;
          hasMarkedReadRef.current = true;
          observer.disconnect();
          useProgressStore.getState().markAyahRead(surahNumber, ayahNumber);
        }, READ_DWELL_MS);
      },
      { threshold: READ_THRESHOLDS }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      stopTimer();
    };
  }, [ayah.id, surahNumber, ayahNumber]);

  const handlePlayPause = () => {
    if (isThisAyahPlaying) {
      pause();
    } else {
      // Prime audio playback on direct user gesture (mobile autoplay policies)
      const playResult = audioManager.play();
      if (playResult && typeof (playResult as Promise<void>).catch === "function") {
        void (playResult as Promise<void>).catch(() => {
          // ignore – actual source will be loaded via AudioPlayer effect
        });
      }
      setQueue(queueAyahs, queueSource);
      play(ayah);
      useProgressStore
        .getState()
        .updateLastPosition(surahNumber, ayahNumber, surahNameLatin, "reader");
    }
  };

  const handleBookmark = () => {
    const wasBookmarked = bookmarked;
    toggleBookmark(surahNumber, ayahNumber, surahNameLatin, ayah.arabicText, ayah.translationBosnian);
    showToast(
      wasBookmarked
        ? `${ayah.ayahNumber}. ajet je uklonjen iz sačuvanih.`
        : `${ayah.ayahNumber}. ajet je sačuvan.`,
    );
  };

  // Names say which ayah; in the juz reader the surah too, since one page mixes several.
  const label =
    queueSource === "juz"
      ? `${ayah.ayahNumber}. ajet sure ${surahNameLatin}`
      : `${ayah.ayahNumber}. ajet`;
  const numberId = `ayah-number-${ayah.id.replace(":", "-")}`;

  const segments =
    ayah.tajwidSegments?.length > 0
      ? ayah.tajwidSegments
      : [{ text: ayah.arabicText, rule: "normal" as const }];

  return (
    <article
      ref={cardRef}
      id={`ayah-${ayah.id.replace(":", "-")}`}
      aria-labelledby={numberId}
      data-ayah-id={ayah.id}
      data-active={isThisAyahPlaying ? "true" : undefined}
      className={`rounded-xl border bg-surface p-4 transition-colors duration-300 border-line md:px-6 md:py-6 ${
        // The tajwid colors keep 3:1 or more on the full highlight in every theme (lowest 4.13:1,
        // themeTokens.test.ts). The accent border marks the playing ayah without relying on color.
        isThisAyahPlaying
          ? "border-l-[3px] border-l-accent-text bg-highlight"
          : ""
      }`}
    >
      {/* Meta row */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <span
          id={numberId}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-sunken text-sm font-medium text-ink-muted"
        >
          {ayah.ayahNumber}
          <span className="sr-only">
            {queueSource === "juz" ? `. ajet sure ${surahNameLatin}` : ". ajet"}
          </span>
        </span>
        <div className="flex items-center gap-2">
          {showPageBadge && ayah.page > 0 && (
            <span className="text-xs text-ink-muted">
              <span aria-hidden>Str. {ayah.page}</span>
              <span className="sr-only">Stranica {ayah.page}</span>
            </span>
          )}
          {isThisAyahPlaying && (
            <span className="text-xs font-medium text-accent-text" aria-hidden>
              Sluša se
            </span>
          )}
          <button
            type="button"
            onClick={handleBookmark}
            className={`min-h-[44px] min-w-[44px] rounded-lg p-3 transition-all duration-200 ease-out hover:scale-105 active:scale-95 ${
              bookmarked
                ? "text-accent-text hover:bg-surface-sunken"
                : "text-ink-muted hover:bg-surface-sunken hover:text-ink"
            }`}
            aria-label={bookmarked ? `Ukloni ${label} iz sačuvanih` : `Sačuvaj ${label}`}
            title={bookmarked ? `Ukloni ${label} iz sačuvanih` : `Sačuvaj ${label}`}
          >
            <Bookmark
              className={`h-5 w-5 transition-transform duration-200 ${bookmarked ? "fill-current" : ""}`}
              aria-hidden
            />
          </button>
          <button
            type="button"
            className="min-h-[44px] min-w-[44px] rounded-lg p-3 text-ink-muted hover:bg-surface-sunken hover:text-accent-text"
            aria-label={isThisAyahPlaying ? `Pauziraj ${label}` : `Pusti ${label}`}
            title={isThisAyahPlaying ? `Pauziraj ${label}` : `Pusti ${label}`}
            onClick={handlePlayPause}
          >
            {isThisAyahPlaying ? (
              <Pause className="h-5 w-5 fill-current" aria-hidden />
            ) : (
              <Play className="h-5 w-5 fill-current" aria-hidden />
            )}
          </button>
        </div>
      </div>

      {/* Body — single column mobile/tablet, 2-col grid lg+ when translation visible */}
      <div
        className={
          showTranslation && ayah.translationBosnian
            ? "lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start"
            : ""
        }
      >
        <div className="lg:order-1">
          {/* Arabic */}
          {wordByWord ? (
            <AyahWordByWord
              ayah={ayah}
              verse={wordTimestamps}
              currentTimeMs={wordTimeMs}
              showColors={showTajwidColors}
              onSeekMs={(ms) => playAyahFromMs(ayah, queueAyahs, ms, queueSource)}
              className={
                showTranslation && ayah.translationBosnian
                  ? "text-center lg:text-right"
                  : "text-center"
              }
              style={{ fontSize: `${effectiveFontSize}px` }}
            />
          ) : (
            <TajwidTextRenderer
              segments={segments}
              showColors={showTajwidColors}
              className={
                showTranslation && ayah.translationBosnian
                  ? "text-center lg:text-right"
                  : "text-center"
              }
              style={{ fontSize: `${effectiveFontSize}px` }}
            />
          )}

          {showTransliteration && ayah.transliteration && (
            <p
              className={`mt-5 font-transliteration text-[1.125rem] leading-[1.55] md:text-[1.1875rem] text-ink-muted ${
                showTranslation && ayah.translationBosnian
                  ? "text-center lg:text-right"
                  : "text-center"
              }`}
            >
              {ayah.transliteration}
            </p>
          )}
        </div>

        {showTranslation && ayah.translationBosnian && (
          <p className="mt-4 text-center font-read text-[1.0625rem] leading-[1.6] md:text-lg text-ink lg:order-2 lg:mt-0 lg:pt-2 lg:text-left">
            {ayah.translationBosnian}
          </p>
        )}
      </div>
    </article>
  );
});

