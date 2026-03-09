import { NextResponse } from "next/server";
import { fetchWordsFromDb } from "@/lib/supabase/surahs-data";

const CACHE_MAX_AGE = 86400;

type PageProps = { params: Promise<{ surahNumber: string }> };

export async function GET(_request: Request, context: PageProps) {
  const { surahNumber: param } = await context.params;
  const surahNumber = parseInt(param, 10);
  if (Number.isNaN(surahNumber) || surahNumber < 1 || surahNumber > 114) {
    return NextResponse.json({ error: "Invalid surah number" }, { status: 404 });
  }
  try {
    const words = await fetchWordsFromDb(surahNumber);
    return NextResponse.json(words, {
      headers: { "Cache-Control": "public, max-age=" + CACHE_MAX_AGE },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal server error";
    if (msg.includes("Surah not found")) {
      return NextResponse.json({ error: "Surah not found" }, { status: 404 });
    }
    console.error("API surah words:", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
