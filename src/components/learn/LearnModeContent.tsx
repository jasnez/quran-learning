"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import type { SurahSummary, Ayah } from "@/types/quran";
import { usePlayerStore } from "@/store/playerStore";
import { useSettingsStore } from "@/store/settingsStore";
import { TajwidTextRenderer } from "@/components/quran/TajwidTextRenderer";

type LearnModeContentProps = { surah: SurahSummary; ayahs: Ayah[] };

export function LearnModeContent({ surah, ayahs }: LearnModeContentProps) {
  const arabicFontSize = useSettingsStore((s) => s.arabicFontSize);
  const showTransliteration = useSettingsStore((s) => s.showTransliteration);
  const showTranslation = useSettingsStore((s) => s.showTranslation);
  const showTajwidColors = useSettingsStore((s) => s.showTajwidColors);
  const repeatAyah = useSettingsStore((s) => s.repeatAyah);
  const toggleTransliteration = useSettingsStore((s) => s.toggleTransliteration);
  const toggleTranslation = useSettingsStore((s) => s.toggleTranslation);
  const toggleRepeatAyah = useSettingsStore((s) => s.toggleRepeatAyah);

  const currentAyahId = usePlayerStore((s) => s.currentAyahId);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const setCurrentAyah = usePlayerStore((s) => s.setCurrentAyah);
  const play = usePlayerStore((s) => s.play);
  const pause = usePlayerStore((s) => s.pause);
  const next = usePlayerStore((s) => s.next);
  const previous = usePlayerStore((s) => s.previous);

  const currentIndex = useMemo(() => {
    const idx = ayahs.findIndex((a) => a.id === currentAyahId);
    return idx >= 0 ? idx : 0;
  }, [ayahs, currentAyahId]);

  const ayah = ayahs[currentIndex];
  const isThisAyahPlaying = currentAyahId === ayah?.id && isPlaying;
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < ayahs.length - 1;

  useEffect(() => {
    if (ayahs.length === 0) return;
    setQueue(ayahs);
    const currentInList = ayahs.some((a) => a.id === currentAyahId);
    if (!currentAyahId || !currentInList) {
      setCurrentAyah(ayahs[0]);
    }
  }, [ayahs, setQueue, setCurrentAyah, currentAyahId]);

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
      setQueue(ayahs);
      play(ayah);
    }
  };

  const learnFontSize = Math.max(arabicFontSize + 12, 40);

  return (
    <>
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
            {surah.nameBosnian && (
              <>
                <span className="mx-1.5 text-stone-400">·</span>
                {surah.nameBosnian}
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

      {/* Center: Arabic (very large), transliteration, translation */}
      <section className="flex flex-1 flex-col justify-center py-8" aria-label="Trenutni ajet">
        <article className="rounded-2xl border border-stone-200/80 bg-white/50 px-6 py-10 dark:border-stone-700/80 dark:bg-stone-900/20">
          <TajwidTextRenderer
            segments={segments}
            showColors={showTajwidColors}
            style={{ fontSize: `${learnFontSize}px` }}
          />
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
            onClick={previous}
          >
            <PrevIcon />
          </button>
          <button
            type="button"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 dark:bg-emerald-500 dark:hover:bg-emerald-400"
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
            onClick={next}
          >
            <NextIcon />
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            className="rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-700"
            aria-label={repeatAyah ? "Isključi ponavljanje" : "Ponavljaj ajet"}
            aria-pressed={repeatAyah}
            onClick={toggleRepeatAyah}
          >
            Ponavljaj
          </button>
          <button
            type="button"
            className="rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-700"
            aria-label={showTransliteration ? "Sakrij transliteraciju" : "Prikaži transliteraciju"}
            aria-pressed={showTransliteration}
            onClick={toggleTransliteration}
          >
            Transliteracija
          </button>
          <button
            type="button"
            className="rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-700"
            aria-label={showTranslation ? "Sakrij prijevod" : "Prikaži prijevod"}
            aria-pressed={showTranslation}
            onClick={toggleTranslation}
          >
            Prijevod
          </button>
        </div>
      </footer>
    </>
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
