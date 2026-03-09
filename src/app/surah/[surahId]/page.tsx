import { notFound } from "next/navigation";
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
      <section className="mt-12">
        <SurahReaderContent ayahs={ayahs} initialAyahNumber={validInitialAyah} surahNameLatin={surah.nameLatin} initialAutoplay={autoplay} />
      </section>
    </main>
  );
}
