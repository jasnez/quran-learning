import { notFound } from "next/navigation";
import { getSurahByNumber } from "@/lib/data";
import { fetchVersesByChapter } from "@/lib/quran/fetch-verses";
import { LearnModeContent } from "@/components/learn/LearnModeContent";

type PageProps = { params: Promise<{ surahId: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { surahId } = await params;
  const n = parseInt(surahId, 10);
  if (Number.isNaN(n) || n < 1 || n > 114) {
    return { title: "Learn | Quran Learning" };
  }
  try {
    const { surah } = getSurahByNumber(n);
    return {
      title: `Learn ${surah.nameLatin} | Quran Learning`,
      description: `Fokusirano učenje sure ${surah.nameBosnian || surah.nameLatin}`,
    };
  } catch {
    return { title: "Learn | Quran Learning" };
  }
}

export default async function LearnPage({ params }: PageProps) {
  const { surahId } = await params;
  const surahNumber = parseInt(surahId, 10);

  if (Number.isNaN(surahNumber) || surahNumber < 1 || surahNumber > 114) {
    notFound();
    return null;
  }

  let detail;
  try {
    detail = getSurahByNumber(surahNumber);
  } catch {
    notFound();
    return null;
  }

  let { surah, ayahs } = detail;

  // Za sure bez lokalnog JSON-a učitaj ajate s Quran.com API-ja (pun sadržaj za svih 114 sura)
  if (ayahs.length === 0) {
    try {
      ayahs = await fetchVersesByChapter(surahNumber);
    } catch {
      // Ostavi prazan niz; LearnModeContent prikazat će poruku o nedostupnosti
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-[700px] px-4 py-6 flex flex-col">
      <LearnModeContent surah={surah} ayahs={ayahs} />
    </main>
  );
}
