import type { SurahSummary } from "@/types/quran";

const revelationLabel: Record<string, string> = {
  meccan: "Meka",
  medinan: "Medina",
};

type SurahHeaderProps = { surah: SurahSummary };

export function SurahHeader({ surah }: SurahHeaderProps) {
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
    </header>
  );
}
