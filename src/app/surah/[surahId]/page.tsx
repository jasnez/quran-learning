import { notFound } from "next/navigation";
import Link from "next/link";
import { getSurahByNumber } from "@/lib/data";
import { fetchVersesByChapter } from "@/lib/quran/fetch-verses";
import { SurahHeader, SurahReaderContent } from "@/components/reader";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ surahId: string }>;
  searchParams?: Promise<{ ayah?: string; autoplay?: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { surahId } = await params;
  const n = parseInt(surahId, 10);
  if (Number.isNaN(n) || n < 1 || n > 114) {
    return { title: "Surah | Quran Learning" };
  }
  try {
    const { surah } = await getSurahByNumber(n);
    return {
      title: `${surah.nameLatin} | Quran Learning`,
      description: `Čitanje sure ${surah.nameBosnian || surah.nameLatin}`,
    };
  } catch {
    return { title: "Surah | Quran Learning" };
  }
}

export default async function SurahReaderPage({ params, searchParams }: PageProps) {
  const { surahId } = await params;
  const resolvedSearchParams = searchParams != null ? await searchParams : {};
  const ayahParam = resolvedSearchParams?.ayah;
  const autoplay = resolvedSearchParams?.autoplay === "1";
  const initialAyahNumber = ayahParam != null ? parseInt(ayahParam, 10) : undefined;
  const validInitialAyah = Number.isInteger(initialAyahNumber) && (initialAyahNumber as number) >= 1 ? (initialAyahNumber as number) : undefined;

  const surahNumber = parseInt(surahId, 10);

  if (Number.isNaN(surahNumber) || surahNumber < 1 || surahNumber > 114) {
    notFound();
    return null;
  }

  let detail;
  try {
    detail = await getSurahByNumber(surahNumber);
  } catch {
    notFound();
    return null;
  }

  let { surah, ayahs } = detail;

  // Prethodna / sljedeća sura za navigaciju
  let prevSurah: { surahNumber: number; nameLatin: string; nameBosnian?: string } | null = null;
  let nextSurah: { surahNumber: number; nameLatin: string; nameBosnian?: string } | null = null;
  if (surahNumber > 1) {
    try {
      const prev = await getSurahByNumber(surahNumber - 1);
      prevSurah = { surahNumber: prev.surah.surahNumber, nameLatin: prev.surah.nameLatin, nameBosnian: prev.surah.nameBosnian };
    } catch {
      // ignore
    }
  }
  if (surahNumber < 114) {
    try {
      const next = await getSurahByNumber(surahNumber + 1);
      nextSurah = { surahNumber: next.surah.surahNumber, nameLatin: next.surah.nameLatin, nameBosnian: next.surah.nameBosnian };
    } catch {
      // ignore
    }
  }

  // Fallback: if no ayahs in DB (e.g. not seeded), try Quran.com API
  if (ayahs.length === 0) {
    try {
      ayahs = await fetchVersesByChapter(surahNumber);
    } catch {
      // Ostavi prazan niz; SurahReaderContent prikazat će "Podaci će uskoro biti dostupni"
    }
  }

  return (
    <main className="mx-auto max-w-[800px] px-4 py-8">
      <SurahHeader surah={surah} ayahs={ayahs} />
      <nav
        className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--theme-border)] pb-4 text-sm"
        aria-label="Navigacija između sura"
      >
        <div className="flex items-center gap-2">
          {prevSurah ? (
            <Link
              href={`/surah/${prevSurah.surahNumber}`}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--theme-border)] px-3 py-1.5 text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              <span aria-hidden>←</span>
              <span>Prethodna: {prevSurah.nameBosnian ?? prevSurah.nameLatin}</span>
            </Link>
          ) : (
            <Link
              href="/surahs"
              className="rounded-full border border-[var(--theme-border)] px-3 py-1.5 text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              Pregled sura
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/learn/${surahNumber}`}
            className="rounded-full border-2 border-emerald-600 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
          >
            Režim učenja
          </Link>
          <Link
            href="/surahs"
            className="rounded-full border border-[var(--theme-border)] px-3 py-1.5 text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            Sve sure
          </Link>
          {nextSurah && (
            <Link
              href={`/surah/${nextSurah.surahNumber}`}
              className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400"
            >
              <span>Sljedeća: {nextSurah.nameBosnian ?? nextSurah.nameLatin}</span>
              <span aria-hidden>→</span>
            </Link>
          )}
        </div>
      </nav>
      <section className="mt-12">
        <SurahReaderContent ayahs={ayahs} initialAyahNumber={validInitialAyah} surahNameLatin={surah.nameLatin} initialAutoplay={autoplay} />
      </section>
    </main>
  );
}
