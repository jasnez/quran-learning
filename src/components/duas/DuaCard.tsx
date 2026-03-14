"use client";

import Link from "next/link";
import { usePlayerStore } from "@/store/playerStore";
import { getAyahIdsFromDua } from "@/lib/duas/getAyahIdsFromDua";
import type { DisplayDua } from "@/types/duas";

type DuaCardProps = { dua: DisplayDua };

export function DuaCard({ dua }: DuaCardProps) {
  const citationLabel =
    dua.ayahEnd != null
      ? `Kur'an ${dua.surahNumber}:${dua.ayahNumber}–${dua.ayahEnd}`
      : `Kur'an ${dua.surahNumber}:${dua.ayahNumber}`;
  const readerHref = `/surah/${dua.surahNumber}?ayah=${dua.ayahNumber}`;

  const handlePlay = () => {
    const ids = getAyahIdsFromDua(dua);
    usePlayerStore.getState().playAyahIds(ids);
  };

  return (
    <article
      className="w-full rounded-2xl border border-stone-200/80 bg-white/50 p-6 dark:border-stone-700/80 dark:bg-stone-900/20"
      aria-labelledby={`dua-arabic-${dua.id}`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-stone-400 dark:text-stone-500">
          Dova iz Kur&apos;ana
        </p>
        <button
          type="button"
          onClick={handlePlay}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-700 dark:hover:text-stone-300"
          aria-label="Slušaj dovu"
        >
          <PlayIcon className="h-5 w-5" />
        </button>
      </div>
      <p
        id={`dua-arabic-${dua.id}`}
        className="font-arabic text-2xl font-medium text-[var(--theme-text)] leading-relaxed md:text-3xl"
        dir="rtl"
        lang="ar"
      >
        {dua.arabic}
      </p>
      <p className="mt-4 text-lg text-stone-500 dark:text-stone-400">
        {dua.transliteration}
      </p>
      <p className="mt-2 text-base leading-relaxed text-stone-700 dark:text-stone-300">
        {dua.translationBosnian}
      </p>
      <p className="mt-4 text-sm text-stone-500 dark:text-stone-400">
        <Link
          href={readerHref}
          className="font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
        >
          {citationLabel}
        </Link>
      </p>
    </article>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
