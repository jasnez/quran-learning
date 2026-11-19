import { notFound } from "next/navigation";
import Link from "next/link";
import { getSurahByNumber } from "@/lib/data";
import { surahNameWithCommon } from "@/lib/quran/surahNames";
import { SurahHeader, SurahReaderContent } from "@/components/reader";
import { SurahAyahNav } from "@/components/reader/SurahAyahNav";

export function generateStaticParams() {
  return Array.from({ length: 114 }, (_, i) => ({ surahId: String(i + 1) }));
}

type PageProps = {
  params: Promise<{ surahId: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { surahId } = await params;
  const n = parseInt(surahId, 10);
  if (Number.isNaN(n) || n < 1 || n > 114) {
    return { title: "Sura" };
  }
  try {
    const { surah } = await getSurahByNumber(n);
    return {
      title: `${surah.nameLatin}`,
      description: `Čitanje sure ${surahNameWithCommon(surah)}`,
    };
  } catch {
    return { title: "Sura" };
  }
}

export default async function SurahReaderPage({ params }: PageProps) {
  const { surahId } = await params;
  // searchParams (?ayah, ?autoplay) read on the client in SurahReaderContent
  // — they can't be accessed in a statically-exported server component.
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

  const { surah } = detail;
  const { ayahs } = detail;

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

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
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
              Prethodna sura: {prevSurah.nameLatin}
            </Link>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {/* No prefetch: it would download a second copy of the surah on every visit (QA section 6). */}
          <Link
            href={`/learn/${surahNumber}`}
            prefetch={false}
            className="rounded-full border-2 border-emerald-600 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
          >
            Uči ajet po ajet
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
              className="inline-flex items-center gap-1 rounded-full bg-emerald-700 px-3 py-1.5 text-white hover:bg-emerald-800"
            >
              Sljedeća sura: {nextSurah.nameLatin}
            </Link>
          )}
        </div>
      </nav>
      <div className="mt-12 lg:flex lg:items-start lg:gap-8">
        <SurahAyahNav ayahs={ayahs} surahNumber={surahNumber} />
        <section className="min-w-0 flex-1">
          <SurahReaderContent ayahs={ayahs} surahNameLatin={surah.nameLatin} />
        </section>
      </div>
    </div>
  );
}
