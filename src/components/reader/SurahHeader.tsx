"use client";

import type { SurahSummary, Ayah } from "@/types/quran";
import { usePlayerStore } from "@/store/playerStore";
import { useProgressStore } from "@/store/progressStore";
import * as audioManager from "@/lib/audio/audioManager";

const revelationLabel: Record<string, string> = {
  meccan: "Meka",
  medinan: "Medina",
};

type SurahHeaderProps = { surah: SurahSummary; ayahs?: Ayah[] };

export function SurahHeader({ surah, ayahs = [] }: SurahHeaderProps) {
  const setQueue = usePlayerStore((s) => s.setQueue);
  const play = usePlayerStore((s) => s.play);
  const progress = useProgressStore((s) => s.getSurahProgress(surah.surahNumber));

  const totalAyahs = ayahs.length > 0 ? ayahs.length : surah.ayahCount;
  const listened = progress?.ayahsListened.size ?? 0;
  const percent = totalAyahs > 0 ? Math.round((listened / totalAyahs) * 100) : 0;
  const showProgress = listened > 0 && totalAyahs > 0;

  const pages = ayahs
    .map((a) => a.page)
    .filter((p) => typeof p === "number" && p > 0);
  const hasPageInfo = pages.length > 0;
  const minPage = hasPageInfo ? Math.min(...pages) : null;
  const maxPage = hasPageInfo ? Math.max(...pages) : null;
  const pageLabel =
    hasPageInfo && minPage != null && maxPage != null
      ? minPage === maxPage
        ? `Stranica: ${minPage}`
        : `Stranice: ${minPage}\u2013${maxPage}`
      : null;

  const handlePlayFullSurah = () => {
    if (ayahs.length === 0) return;
    // Prime audio playback on direct user gesture (mobile autoplay policies)
    const playResult = audioManager.play();
    if (playResult && typeof (playResult as Promise<void>).catch === "function") {
      void (playResult as Promise<void>).catch(() => {
        // ignore – actual source will be loaded via AudioPlayer effect
      });
    }
    setQueue(ayahs);
    play(ayahs[0]);
  };

  return (
    <header className="rounded-2xl border border-stone-200/80 bg-stone-50/80 px-6 py-8 text-center dark:border-stone-700/80 dark:bg-stone-900/40">
      <h1
        className="font-arabic text-4xl font-medium tracking-wide text-stone-900 dark:text-stone-100 md:text-5xl"
        dir="rtl"
        lang="ar"
      >
        {surah.nameArabic}
      </h1>
      <p className="mt-3 text-lg text-stone-600 dark:text-stone-400">
        {surah.nameLatin}
        {surah.nameBosnian && (
          <>
            <span className="mx-2 text-stone-400 dark:text-stone-500">·</span>
            {surah.nameBosnian}
          </>
        )}
      </p>
      <p className="mt-2 text-sm text-stone-500 dark:text-stone-500">
        {surah.ayahCount} ajeta · {revelationLabel[surah.revelationType] ?? surah.revelationType}
      </p>
      {pageLabel && (
        <p className="mt-1 text-xs text-stone-500 dark:text-stone-500" aria-label={`Stranice mushafa za suru ${surah.nameLatin}`}>
          {pageLabel}
        </p>
      )}
      {showProgress && (
        <div className="mt-4" aria-label={`${listened} od ${totalAyahs} ajeta preslušano`}>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {listened}/{totalAyahs} ajeta preslušano
          </p>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700">
            <div
              className="h-full rounded-full bg-emerald-500 dark:bg-emerald-600"
              style={{ width: `${Math.min(100, percent)}%` }}
            />
          </div>
        </div>
      )}
      {ayahs.length > 0 && (
        <div className="mt-6">
          <button
            type="button"
            onClick={handlePlayFullSurah}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-800 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600"
            aria-label="Pusti cijelu suru"
          >
            <PlayIcon className="h-4 w-4" />
            Pusti cijelu suru
          </button>
        </div>
      )}
    </header>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7L8 5z" />
    </svg>
  );
}
