"use client";

import { useContext, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Settings as SettingsIcon } from "lucide-react";
import type { Ayah } from "@/types/quran";
import { SettingsOpenContext } from "@/contexts/SettingsOpenContext";

type Props = {
  surahNameLatin: string;
  surahNumberArabic: string;
  totalAyahs: number;
  ayahs: Ayah[];
};

export function SurahReaderStickyHeader({
  surahNameLatin,
  surahNumberArabic,
  totalAyahs,
  ayahs,
}: Props) {
  const [activeAyahNumber, setActiveAyahNumber] = useState<number>(1);
  const settingsCtx = useContext(SettingsOpenContext);

  useEffect(() => {
    if (ayahs.length === 0) return;
    const elements = ayahs
      .map((a) => document.querySelector(`[data-ayah-id="${a.id}"]`))
      .filter((el): el is Element => el != null);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const top = visible[0];
        if (!top) return;
        const id = top.target.getAttribute("data-ayah-id");
        if (!id) return;
        const ayahNum = parseInt(id.split(":")[1] ?? "1", 10);
        if (Number.isFinite(ayahNum)) setActiveAyahNumber(ayahNum);
      },
      { rootMargin: "-30% 0px -50% 0px", threshold: 0 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ayahs]);

  return (
    <div
      className="sticky top-0 z-30 -mx-4 mb-4 flex items-center gap-2 border-b border-[var(--theme-border)] bg-[var(--theme-card)]/95 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-[var(--theme-card)]/85"
      data-testid="surah-reader-sticky-header"
    >
      <Link
        href="/surahs"
        aria-label="Nazad na listu sura"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200"
      >
        <ChevronLeft className="h-5 w-5" aria-hidden />
      </Link>
      <div className="min-w-0 flex-1 leading-tight">
        <div className="flex items-baseline gap-2">
          <span className="truncate text-sm font-semibold text-stone-900 dark:text-stone-100">
            {surahNameLatin}
          </span>
          <span
            className="shrink-0 text-base text-stone-500 dark:text-stone-500"
            dir="rtl"
            lang="ar"
            aria-hidden
          >
            {surahNumberArabic}
          </span>
        </div>
        <div className="text-[11px] tabular-nums text-stone-500 dark:text-stone-400">
          Ajet {activeAyahNumber} / {totalAyahs}
        </div>
      </div>
      {settingsCtx ? (
        <button
          type="button"
          onClick={() => settingsCtx.open()}
          aria-label="Postavke čitanja"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200"
        >
          <SettingsIcon className="h-[18px] w-[18px]" aria-hidden />
        </button>
      ) : (
        <Link
          href="/settings"
          aria-label="Postavke čitanja"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200"
        >
          <SettingsIcon className="h-[18px] w-[18px]" aria-hidden />
        </Link>
      )}
    </div>
  );
}
