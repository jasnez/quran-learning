import { notFound } from "next/navigation";
import { getAllSurahs, getSurahByNumber } from "@/lib/data";
import { TestMode } from "@/components/test/TestMode";

type PageProps = {
  params: Promise<{ surahId: string }>;
};

export default async function TestPage({ params }: PageProps) {
  const { surahId } = await params;
  const surahNumber = parseInt(surahId, 10);

  if (Number.isNaN(surahNumber) || surahNumber < 1 || surahNumber > 114) {
    notFound();
    return null;
  }

  const [allSurahs, detail] = await Promise.all([
    getAllSurahs(),
    getSurahByNumber(surahNumber),
  ]);

  const { surah, ayahs } = detail;

  return (
    <main className="mx-auto max-w-[800px] px-4 py-8">
      <TestMode surah={surah} ayahs={ayahs} allSurahs={allSurahs} />
    </main>
  );
}

