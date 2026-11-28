"use client";

import { memo, useEffect, useMemo, useRef } from "react";
import { Bookmark } from "lucide-react";
import type { Ayah } from "@/types/quran";
import type { QueueSource } from "@/types/audio";
import { usePlayerStore } from "@/store/playerStore";
import { hasBookmark, useBookmarkStore } from "@/store/bookmarkStore";
import { useToastStore } from "@/store/toastStore";
import { useProgressStore } from "@/store/progressStore";
import type { VerseTimestamp } from "@/types/wordByWord";
import { TajwidTextRenderer } from "@/components/quran/TajwidTextRenderer";
import { AyahWordByWord } from "@/components/quran/AyahWordByWord";
import { AyahText } from "@/components/quran/AyahText";
import { Rosette } from "@/components/quran/Rosette";
import { PauseIcon, PlayIcon } from "@/components/ui/icons";
import { useIsMobile } from "@/hooks/useMediaQuery";
import * as audioManager from "@/lib/audio/audioManager";
import { playAyahFromMs } from "@/lib/audio/playFromWord";

const ARABIC_MIN_MOBILE_PX = 24;
/** An ayah counts as read once its unit has been in view this long without a break. */
const READ_DWELL_MS = 2000;
/** In view: at least this share of the unit, or of the screen for an ayah taller than it. */
const READ_VISIBLE_SHARE = 0.5;
/** Steps at which the observer reports, so a tall unit is seen filling half the screen. */
const READ_THRESHOLDS = [0, 0.25, 0.5, 0.75, 1];

type AyahUnitProps = {
  ayah: Ayah;
  /** Ayahs queued when playback starts from this unit (the surah in the reader, the whole juz in the juz reader). */
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
  /** Name the mushaf page: for the first ayah on a page. */
  showPageBadge?: boolean;
  /** "flow": one ayah in the text of a surah, set off by a line. "card": an ayah on its own. */
  variant?: "flow" | "card";
};

function parseAyahId(id: string): { surahNumber: number; ayahNumber: number } {
  const [s, a] = id.split(":").map(Number);
  return { surahNumber: s ?? 1, ayahNumber: a ?? 1 };
}

const ACTION_BUTTON =
  "flex h-11 w-11 items-center justify-center rounded-control transition-colors duration-press ease-standard hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text";

/**
 * One ayah: the Arabic with its rosette, the transcription, the translation, and its actions.
 * In a surah it flows as text, as in a mushaf; only the ayah that plays gets a background.
 *
 * Memoized, and every player value is selected per unit: while audio plays the clock changes on
 * every animation frame, and a surah has up to 286 units (QA P1-9). Only the unit whose own
 * selected values change re-renders.
 */
export const AyahUnit = memo(function AyahUnit({
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
  variant = "flow",
}: AyahUnitProps) {
  const isThisAyahPlaying = usePlayerStore((s) => s.currentAyahId === ayah.id && s.isPlaying);
  // Position in this ayah's audio file for the word highlight. Only the ayah whose audio is
  // loaded gets the clock; every other unit (and a stopped player) stays at -1.
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
  const unitRef = useRef<HTMLElement>(null);
  const hasMarkedReadRef = useRef(false);

  // Read = in view for READ_DWELL_MS without a break, so units that scroll past (also on the
  // way to a ?ayah= target) do not count (QA P2-8).
  useEffect(() => {
    const el = unitRef.current;
    if (!el || hasMarkedReadRef.current) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const stopTimer = () => {
      if (timer !== null) clearTimeout(timer);
      timer = null;
    };
    const observer = new IntersectionObserver(
      (entries) => {
        // A busy main thread can deliver several reports for this unit at once (in, then out):
        // the latest one is where the unit is now.
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

  // One element per (number, playing): the memoized word list compares it by identity, so a new
  // element on every frame of the playing ayah would re-render the whole list (QA P1-9).
  const rosette = useMemo(
    () => <Rosette number={ayah.ayahNumber} filled={isThisAyahPlaying} />,
    [ayah.ayahNumber, isThisAyahPlaying],
  );
  const arabicStyle = useMemo(() => ({ fontSize: `${effectiveFontSize}px` }), [effectiveFontSize]);

  const frame =
    variant === "card"
      ? `rounded-card border border-line p-4 md:p-5 ${isThisAyahPlaying ? "bg-highlight" : "bg-surface"}`
      : // The playing ayah widens into the page margin, so its text stays on the column's edge.
        isThisAyahPlaying
        ? "-mx-3 rounded-xl border-t border-transparent bg-highlight px-3 py-5"
        : "border-t border-line py-5";

  return (
    <article
      ref={unitRef}
      id={`ayah-${ayah.id.replace(":", "-")}`}
      aria-labelledby={numberId}
      data-ayah-id={ayah.id}
      data-active={isThisAyahPlaying ? "true" : undefined}
      // The highlight, the filled rosette, the pause icon and "Sluša se" mark the playing ayah:
      // never color alone. The tajwid colors keep 3:1 or more on the highlight (themeTokens.test.ts).
      className={`transition-colors duration-sheet ease-standard ${frame}`}
    >
      {/* The rosette is ornament; this names the ayah for screen readers. */}
      <span id={numberId} className="sr-only">
        {label}
      </span>

      <AyahText
        arabic={
          wordByWord ? (
            <AyahWordByWord
              ayah={ayah}
              verse={wordTimestamps}
              currentTimeMs={wordTimeMs}
              showColors={showTajwidColors}
              onSeekMs={(ms) => playAyahFromMs(ayah, queueAyahs, ms, queueSource)}
              className="text-right"
              style={arabicStyle}
              trailing={rosette}
            />
          ) : (
            <TajwidTextRenderer
              segments={segments}
              showColors={showTajwidColors}
              className="text-right"
              style={arabicStyle}
              trailing={rosette}
            />
          )
        }
        transliteration={showTransliteration ? ayah.transliteration : null}
        translation={showTranslation ? ayah.translationBosnian : null}
      />

      {/* Actions: always visible, on every width. */}
      <div className="-ml-2.5 mt-3 flex items-center gap-1">
        <button
          type="button"
          className={`${ACTION_BUTTON} ${isThisAyahPlaying ? "text-accent-text" : "text-ink-muted hover:text-ink"}`}
          aria-label={isThisAyahPlaying ? `Pauziraj ${label}` : `Pusti ${label}`}
          title={isThisAyahPlaying ? `Pauziraj ${label}` : `Pusti ${label}`}
          onClick={handlePlayPause}
        >
          {isThisAyahPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
        {/* The name carries the state ("Sačuvaj" / "Ukloni ... iz sačuvanih"), so the button has
            no pressed attribute: that would say the state twice. */}
        <button
          type="button"
          onClick={handleBookmark}
          className={`${ACTION_BUTTON} ${bookmarked ? "text-accent-text" : "text-ink-muted hover:text-ink"}`}
          aria-label={bookmarked ? `Ukloni ${label} iz sačuvanih` : `Sačuvaj ${label}`}
          title={bookmarked ? `Ukloni ${label} iz sačuvanih` : `Sačuvaj ${label}`}
        >
          <Bookmark className={`h-5 w-5 ${bookmarked ? "fill-current" : ""}`} strokeWidth={1.75} aria-hidden />
        </button>
        {isThisAyahPlaying && (
          <span className="ml-1 text-[0.8125rem] font-semibold text-accent-text" aria-hidden>
            Sluša se
          </span>
        )}
        {showPageBadge && ayah.page > 0 && (
          <span className="ml-auto text-[0.8125rem] text-ink-muted">
            <span aria-hidden>str. {ayah.page}</span>
            <span className="sr-only">Stranica {ayah.page}</span>
          </span>
        )}
      </div>
    </article>
  );
});
