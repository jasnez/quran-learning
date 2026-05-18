import { NextResponse } from "next/server";
import { getSurahDetail } from "@/lib/data/static-quran";

const CACHE_MAX_AGE = 86400;

type PageProps = { params: Promise<{ surahNumber: string }> };

export async function GET(_request: Request, context: PageProps) {
  const { surahNumber: param } = await context.params;
  const surahNumber = parseInt(param, 10);
  if (Number.isNaN(surahNumber) || surahNumber < 1 || surahNumber > 114) {
    return NextResponse.json({ error: "Invalid surah number" }, { status: 404 });
  }
  const detail = await getSurahDetail(surahNumber);
  if (!detail) {
    return NextResponse.json({ error: "Surah not found" }, { status: 404 });
  }
  return NextResponse.json(detail, {
    headers: { "Cache-Control": "public, max-age=" + CACHE_MAX_AGE },
  });
}
