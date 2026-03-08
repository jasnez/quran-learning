"use client";

import type { Ayah } from "@/types/quran";
import { usePlayerStore } from "@/store/playerStore";
import { useBookmarkStore } from "@/store/bookmarkStore";
import { useToastStore } from "@/store/toastStore";
import { TajwidTextRenderer } from "@/components/quran/TajwidTextRenderer";
import { useIsMobile } from "@/hooks/useMediaQuery";

const ARABIC_MIN_MOBILE_PX = 22;

type AyahCardProps = {
  ayah: Ayah;
  surahAyahs: Ayah[];
  surahNameLatin: string;
  arabicFontSize: number;
  showTransliteration: boolean;
  showTranslation: boolean;
  showTajwidColors: boolean;
};

function parseAyahId(id: string): { surahNumber: number; ayahNumber: number } {
  const [s, a] = id.split(":").map(Number);
  return { surahNumber: s ?? 1, ayahNumber: a ?? 1 };
}

export function AyahCard({
  ayah,
  surahAyahs,
  surahNameLatin,
  arabicFontSize,
  showTransliteration,
  showTranslation,
  showTajwidColors,
}: AyahCardProps) {
  const currentAyahId = usePlayerStore((s) => s.currentAyahId);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const play = usePlayerStore((s) => s.play);
  const pause = usePlayerStore((s) => s.pause);

  const toggleBookmark = useBookmarkStore((s) => s.toggleBookmark);
  const { surahNumber, ayahNumber } = parseAyahId(ayah.id);
  const bookmarked = useBookmarkStore((s) => s.isBookmarked(surahNumber, ayahNumber));
  const showToast = useToastStore((s) => s.showToast);

  const isThisAyahPlaying = currentAyahId === ayah.id && isPlaying;
  const isMobile = useIsMobile();
  const effectiveFontSize = isMobile ? Math.max(ARABIC_MIN_MOBILE_PX, arabicFontSize) : arabicFontSize;

  const handlePlayPause = () => {
    if (isThisAyahPlaying) {
      pause();
    } else {
      setQueue(surahAyahs);
      play(ayah);
    }
  };

  const handleBookmark = () => {
    const wasBookmarked = bookmarked;
    toggleBookmark(surahNumber, ayahNumber, surahNameLatin, ayah.arabicText);
    showToast(wasBookmarked ? "Ajet uklonjen iz oznacenih" : "Ajet dodan u oznacene");
  };

  const segments =
    ayah.tajwidSegments?.length > 0
      ? ayah.tajwidSegments
      : [{ text: ayah.arabicText, rule: "normal" as const }];

  return (
    <article
      id={`ayah-${ayah.id.replace(":", "-")}`}
      data-ayah-id={ayah.id}
      data-active={isThisAyahPlaying ? "true" : undefined}
      className={`rounded-2xl border bg-[var(--theme-card)] p-5 px-4 transition-colors duration-300 border-[var(--theme-border)] md:px-6 md:py-8 ${
        isThisAyahPlaying
          ? "border-l-[3px] border-l-emerald-500 bg-amber-50/50 dark:bg-amber-950/20 dark:border-l-emerald-400"
          : ""
      }`}
    >
      {/* Meta row */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-sm font-medium text-stone-600 dark:bg-stone-700 dark:text-stone-400"
          aria-hidden
        >
          {ayah.ayahNumber}
        </span>
        <div className="flex items-center gap-2">
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
            title={bookmarked ? "Ukloni iz označenih" : "Dodaj u označene"}
          >
            <BookmarkIcon filled={bookmarked} />
          </button>
          <button
            type="button"
            className="min-h-[44px] min-w-[44px] rounded-lg p-3 text-stone-500 hover:bg-stone-100 hover:text-emerald-600 dark:hover:bg-stone-700 dark:hover:text-emerald-400"
            aria-label={isThisAyahPlaying ? "Pauza" : "Pusti audio"}
            title={isThisAyahPlaying ? "Pauza" : "Pusti audio"}
            onClick={handlePlayPause}
          >
            {isThisAyahPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>
        </div>
      </div>

      {/* Arabic */}
      <TajwidTextRenderer
        segments={segments}
        showColors={showTajwidColors}
        style={{ fontSize: `${effectiveFontSize}px` }}
      />

      {showTransliteration && ayah.transliteration && (
        <p className="mt-8 text-center text-base leading-relaxed text-stone-500 dark:text-stone-400">
          {ayah.transliteration}
        </p>
      )}

      {showTranslation && ayah.translationBosnian && (
        <p className="mt-6 text-center text-base leading-relaxed text-stone-700 dark:text-stone-300">
          {ayah.translationBosnian}
        </p>
      )}
    </article>
  );
}

function BookmarkIcon({ filled }: { filled?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
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

function PlayIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="6" y1="4" x2="6" y2="20" />
      <line x1="18" y1="4" x2="18" y2="20" />
    </svg>
  );
}
