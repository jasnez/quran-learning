"use client";

import type { SurahSummary, Ayah } from "@/types/quran";
import { usePlayerStore } from "@/store/playerStore";

const revelationLabel: Record<string, string> = {
  meccan: "Meka",
  medinan: "Medina",
};

type SurahHeaderProps = { surah: SurahSummary; ayahs?: Ayah[] };

export function SurahHeader({ surah, ayahs = [] }: SurahHeaderProps) {
  const setQueue = usePlayerStore((s) => s.setQueue);
  const play = usePlayerStore((s) => s.play);

  const handlePlayFullSurah = () => {
    if (ayahs.length === 0) return;
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
