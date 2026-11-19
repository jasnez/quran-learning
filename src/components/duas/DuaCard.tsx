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
      className="w-full rounded-2xl border border-line bg-surface/50 p-6"
      aria-labelledby={`dua-arabic-${dua.id}`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
          Dova iz Kur&apos;ana
        </p>
        <button
          type="button"
          onClick={handlePlay}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-surface-sunken hover:text-ink"
          aria-label={`Slušaj dovu, ${citationLabel}`}
        >
          <PlayIcon className="h-5 w-5" />
        </button>
      </div>
      <p
        id={`dua-arabic-${dua.id}`}
        className="font-arabic text-2xl font-normal text-ink leading-relaxed md:text-3xl"
        dir="rtl"
        lang="ar"
      >
        {dua.arabic}
      </p>
      <p className="mt-4 font-transliteration text-lg text-ink-muted">
        {dua.transliteration}
      </p>
      <p className="mt-2 font-read text-[1.0625rem] leading-[1.6] md:text-lg text-ink">
        {dua.translationBosnian}
      </p>
      <p className="mt-4 text-sm text-ink-muted">
        <Link
          href={readerHref}
          className="font-medium text-accent-text underline-offset-2 hover:underline"
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
