import { NextResponse } from "next/server";
import { getWordsForSurah } from "@/lib/data/static-quran";

const CACHE_MAX_AGE = 86400;

type PageProps = { params: Promise<{ surahNumber: string }> };

export async function GET(_request: Request, context: PageProps) {
  const { surahNumber: param } = await context.params;
  const surahNumber = parseInt(param, 10);
  if (Number.isNaN(surahNumber) || surahNumber < 1 || surahNumber > 114) {
    return NextResponse.json({ error: "Invalid surah number" }, { status: 404 });
  }
  const words = await getWordsForSurah(surahNumber);
  return NextResponse.json(words, {
    headers: { "Cache-Control": "public, max-age=" + CACHE_MAX_AGE },
  });
}
