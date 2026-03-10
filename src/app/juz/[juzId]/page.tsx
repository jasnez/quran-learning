import { notFound } from "next/navigation";
import Link from "next/link";
import { getJuzByNumber } from "@/lib/data/juzUtils";
import { getAllSurahs, getAyahsForJuz } from "@/lib/data";
import { JuzReaderContent } from "@/components/reader";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ juzId: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { juzId } = await params;
  const n = parseInt(juzId, 10);
  if (Number.isNaN(n) || n < 1 || n > 30) {
    return { title: "Džuz | Quran Learning" };
  }
  const juz = getJuzByNumber(n);
  if (!juz) return { title: "Džuz | Quran Learning" };
  return {
    title: `Džuz ${juz.juz} — ${juz.name} | Quran Learning`,
    description: `Čitanje džuza ${juz.juz} (${juz.nameArabic})`,
  };
}

export default async function JuzPage({ params }: PageProps) {
  const { juzId } = await params;
  const juzNumber = parseInt(juzId, 10);

  if (Number.isNaN(juzNumber) || juzNumber < 1 || juzNumber > 30) {
    notFound();
    return null;
  }

  const juz = getJuzByNumber(juzNumber);
  if (!juz) {
    notFound();
    return null;
  }

  const [allSurahs, segments] = await Promise.all([getAllSurahs(), getAyahsForJuz(juzNumber)]);

  const startSurahName = allSurahs.find((s) => s.surahNumber === juz.startSurah)?.nameLatin ?? `Sura ${juz.startSurah}`;
  const endSurahName = allSurahs.find((s) => s.surahNumber === juz.endSurah)?.nameLatin ?? `Sura ${juz.endSurah}`;

  return (
    <main className="mx-auto max-w-[800px] px-4 py-8">
      <header className="mb-8 rounded-2xl border border-amber-200/80 bg-amber-50/80 px-6 py-8 text-center dark:border-amber-800/50 dark:bg-stone-900/40">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 md:text-3xl">
          Džuz {juz.juz} — {juz.name}
        </h1>
        <p className="mt-2 font-arabic text-xl text-stone-700 dark:text-stone-300" dir="rtl" lang="ar">
          {juz.nameArabic}
        </p>
        <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
          {startSurahName} {juz.startSurah}:{juz.startAyah} — {endSurahName} {juz.endSurah}:{juz.endAyah}
        </p>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          {segments.reduce((acc, s) => acc + s.ayahs.length, 0)} ajeta · {juz.surahsIncluded.length} sura
        </p>
        <div className="mt-6">
          <Link
            href="/surahs?view=juz"
            className="inline-flex items-center rounded-full border border-[var(--theme-border)] px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800"
          >
            ← Pregled džuzeva
          </Link>
        </div>
      </header>

      <JuzReaderContent juz={juz} segments={segments} />
    </main>
  );
}
