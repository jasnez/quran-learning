import Link from "next/link";
import type { SurahSummary } from "@/types/quran";

const revelationLabel: Record<string, string> = {
  meccan: "Meka",
  medinan: "Medina",
};

export function SurahListItem({ surah }: { surah: SurahSummary }) {
  return (
    <Link
      href={`/surah/${surah.surahNumber}`}
      className="flex min-h-[4rem] items-center gap-4 rounded-xl border border-stone-200/80 bg-white px-4 py-4 transition-colors hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 dark:border-stone-700/80 dark:bg-stone-900/50 dark:hover:bg-stone-800/50"
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-sm font-medium text-stone-600 dark:bg-stone-700 dark:text-stone-400"
        aria-hidden
      >
        {surah.surahNumber}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-stone-900 dark:text-stone-100">
          {surah.nameLatin}
        </p>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          {surah.nameBosnian}
        </p>
        <p className="mt-0.5 text-xs text-stone-400 dark:text-stone-500">
          {surah.ayahCount} ajeta · {revelationLabel[surah.revelationType] ?? surah.revelationType}
        </p>
      </div>
      <span
        className="text-right text-lg font-medium text-stone-700 dark:text-stone-300"
        dir="rtl"
        lang="ar"
      >
        {surah.nameArabic}
      </span>
    </Link>
  );
}
