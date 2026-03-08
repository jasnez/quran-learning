import { notFound } from "next/navigation";
import { getSurahByNumber } from "@/lib/data";
import { SurahHeader, SurahReaderContent } from "@/components/reader";

type PageProps = { params: Promise<{ surahId: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { surahId } = await params;
  const n = parseInt(surahId, 10);
  if (Number.isNaN(n) || n < 1 || n > 114) {
    return { title: "Surah | Quran Learning" };
  }
  try {
    const { surah } = getSurahByNumber(n);
    return {
      title: `${surah.nameLatin} | Quran Learning`,
      description: `Čitanje sure ${surah.nameBosnian || surah.nameLatin}`,
    };
  } catch {
    return { title: "Surah | Quran Learning" };
  }
}

export default async function SurahReaderPage({ params }: PageProps) {
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

  const { surah, ayahs } = detail;

  return (
    <main className="mx-auto max-w-[800px] px-4 py-8">
      <SurahHeader surah={surah} />
      <section className="mt-12">
        <SurahReaderContent ayahs={ayahs} />
      </section>
    </main>
  );
}
