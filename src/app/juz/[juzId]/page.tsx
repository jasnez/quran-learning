import { notFound } from "next/navigation";
import Link from "next/link";
import { getJuzByNumber } from "@/lib/data/juzUtils";
import { getAllSurahs, getAyahsForJuz } from "@/lib/data";
import { AYAH_FORMS, SURAH_FORMS, formatCount } from "@/lib/format";
import { JuzReaderContent } from "@/components/reader";

export function generateStaticParams() {
  return Array.from({ length: 30 }, (_, i) => ({ juzId: String(i + 1) }));
}

type PageProps = {
  params: Promise<{ juzId: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { juzId } = await params;
  const n = parseInt(juzId, 10);
  if (Number.isNaN(n) || n < 1 || n > 30) {
    return { title: "Džuz" };
  }
  const juz = getJuzByNumber(n);
  if (!juz) return { title: "Džuz" };
  return {
    title: `Džuz ${juz.juz} — ${juz.name}`,
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
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8 rounded-2xl border border-line bg-highlight px-6 py-8 text-center">
        <h1 className="text-2xl font-read font-bold tracking-tight text-ink md:text-3xl">
          Džuz {juz.juz} — {juz.name}
        </h1>
        <p className="mt-2 font-arabic text-xl text-ink" dir="rtl" lang="ar">
          {juz.nameArabic}
        </p>
        <p className="mt-2 text-sm text-ink-muted">
          {startSurahName} {juz.startSurah}:{juz.startAyah} — {endSurahName} {juz.endSurah}:{juz.endAyah}
        </p>
        <p className="mt-1 text-sm text-ink-muted">
          {formatCount(segments.reduce((acc, s) => acc + s.ayahs.length, 0), AYAH_FORMS)} · {formatCount(juz.surahsIncluded.length, SURAH_FORMS)}
        </p>
        <div className="mt-6">
          <Link
            href="/surahs?view=juz"
            className="inline-flex items-center rounded-full border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-surface-sunken"
          >
            Svi džuzevi
          </Link>
        </div>
      </header>

      <JuzReaderContent juz={juz} segments={segments} />
    </div>
  );
}
