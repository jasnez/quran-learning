import { NextResponse } from "next/server";
import { fetchSurahsFromDb } from "@/lib/supabase/surahs-data";

const CACHE_MAX_AGE = 86400;

export async function GET() {
  try {
    const surahs = await fetchSurahsFromDb();
    return NextResponse.json(
      { surahs },
      { headers: { "Cache-Control": "public, max-age=" + CACHE_MAX_AGE } }
    );
  } catch (e) {
    console.error("API surahs:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal server error" },
      { status: 500 }
    );
  }
}
