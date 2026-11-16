"use client";

import { useEffect, useRef } from "react";
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

const ARABIC_MIN_MOBILE_PX = 24;

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
  /**
   * Word-by-word mode: show the Arabic as words and highlight the recited one.
   * `currentTimeMs` is the position in this ayah's audio file, negative when it is not playing.
   */
  wordByWord?: {
    verse: VerseTimestamp | undefined;
    currentTimeMs: number;
    onSeekMs: (ayahRelativeMs: number) => void;
  };
  /** Show a subtle page indicator badge for the first ayah on a mushaf page. */
  showPageBadge?: boolean;
};

function parseAyahId(id: string): { surahNumber: number; ayahNumber: number } {
  const [s, a] = id.split(":").map(Number);
  return { surahNumber: s ?? 1, ayahNumber: a ?? 1 };
}

export function AyahCard({
  ayah,
  queueAyahs,
  queueSource = "surah",
  surahNameLatin,
  arabicFontSize,
  showTransliteration,
  showTranslation,
  showTajwidColors,
  wordByWord,
  showPageBadge,
}: AyahCardProps) {
  const currentAyahId = usePlayerStore((s) => s.currentAyahId);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const play = usePlayerStore((s) => s.play);
  const pause = usePlayerStore((s) => s.pause);

  const toggleBookmark = useBookmarkStore((s) => s.toggleBookmark);
  const { surahNumber, ayahNumber } = parseAyahId(ayah.id);
  const bookmarked = useBookmarkStore((s) => hasBookmark(s.bookmarks, surahNumber, ayahNumber));
  const showToast = useToastStore((s) => s.showToast);

  const isThisAyahPlaying = currentAyahId === ayah.id && isPlaying;
  const isMobile = useIsMobile();
  const effectiveFontSize = isMobile ? Math.max(ARABIC_MIN_MOBILE_PX, arabicFontSize) : arabicFontSize;
  const cardRef = useRef<HTMLElement>(null);
  const hasMarkedReadRef = useRef(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el || hasMarkedReadRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting && !hasMarkedReadRef.current) {
          hasMarkedReadRef.current = true;
          useProgressStore.getState().markAyahRead(surahNumber, ayahNumber);
        }
      },
      { rootMargin: "50px", threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
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
    showToast(wasBookmarked ? "Ajet uklonjen iz oznacenih" : "Ajet dodan u oznacene");
  };

  const segments =
    ayah.tajwidSegments?.length > 0
      ? ayah.tajwidSegments
      : [{ text: ayah.arabicText, rule: "normal" as const }];

  return (
    <article
      ref={cardRef}
      id={`ayah-${ayah.id.replace(":", "-")}`}
      data-ayah-id={ayah.id}
      data-active={isThisAyahPlaying ? "true" : undefined}
      className={`rounded-xl border bg-[var(--theme-card)] p-4 transition-colors duration-300 border-[var(--theme-border)] md:px-6 md:py-6 ${
        isThisAyahPlaying
          ? "border-l-[3px] border-l-emerald-500 bg-amber-50/50 dark:bg-amber-950/20 dark:border-l-emerald-400"
          : ""
      }`}
    >
      {/* Meta row */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-sm font-medium text-stone-600 dark:bg-stone-700 dark:text-stone-400"
          aria-hidden
        >
          {ayah.ayahNumber}
        </span>
        <div className="flex items-center gap-2">
          {showPageBadge && ayah.page > 0 && (
            <span
              className="text-xs text-stone-400 dark:text-stone-500"
              aria-label={`Stranica ${ayah.page}`}
            >
              Str. {ayah.page}
            </span>
          )}
          {isThisAyahPlaying && (
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400" aria-hidden>
              Sada se pušta
            </span>
          )}
          <button
            type="button"
            onClick={handleBookmark}
            className={`min-h-[44px] min-w-[44px] rounded-lg p-3 transition-all duration-200 ease-out hover:scale-105 active:scale-95 ${
              bookmarked
                ? "text-amber-500 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/30 dark:hover:text-amber-400"
                : "text-stone-400 hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-stone-700 dark:hover:text-stone-300"
            }`}
            aria-label="Bookmark"
            aria-pressed={bookmarked}
            title={bookmarked ? "Ukloni iz označenih" : "Dodaj u označene"}
          >
            <Bookmark
              className={`h-5 w-5 transition-transform duration-200 ${bookmarked ? "fill-current" : ""}`}
              aria-hidden
            />
          </button>
          <button
            type="button"
            className="min-h-[44px] min-w-[44px] rounded-lg p-3 text-stone-500 hover:bg-stone-100 hover:text-emerald-600 dark:hover:bg-stone-700 dark:hover:text-emerald-400"
            aria-label={isThisAyahPlaying ? "Pauza" : "Pusti audio"}
            title={isThisAyahPlaying ? "Pauza" : "Pusti audio"}
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
              verse={wordByWord.verse}
              currentTimeMs={wordByWord.currentTimeMs}
              showColors={showTajwidColors}
              onSeekMs={wordByWord.onSeekMs}
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
              className={`mt-5 text-sm italic leading-relaxed text-stone-500 dark:text-stone-500 ${
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
          <p className="mt-4 text-center text-[17px] leading-relaxed text-stone-800 dark:text-stone-200 lg:order-2 lg:mt-0 lg:pt-2 lg:text-left">
            {ayah.translationBosnian}
          </p>
        )}
      </div>
    </article>
  );
}

