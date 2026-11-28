import { notFound } from "next/navigation";
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
    // The same reading column as a surah page; the way back is the header's and the EndNav's.
    <div className="mx-auto max-w-[42rem]">
      <header className="mb-8 text-center">
        <h1 className="font-read text-3xl font-bold leading-tight text-ink md:text-[2.5rem]">
          Džuz {juz.juz} — {juz.name}
        </h1>
        <p className="mt-2 font-arabic text-2xl text-ink" dir="rtl" lang="ar">
          {juz.nameArabic}
        </p>
        <p className="mt-2 text-sm text-ink-muted">
          {startSurahName} {juz.startSurah}:{juz.startAyah} — {endSurahName} {juz.endSurah}:{juz.endAyah}
        </p>
        <p className="mt-1 text-sm text-ink-muted">
          {formatCount(segments.reduce((acc, s) => acc + s.ayahs.length, 0), AYAH_FORMS)} · {formatCount(juz.surahsIncluded.length, SURAH_FORMS)}
        </p>
      </header>

      <JuzReaderContent juz={juz} segments={segments} />
    </div>
  );
}
