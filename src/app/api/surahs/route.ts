import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { SurahSummary } from "@/types/quran";

const CACHE_MAX_AGE = 86400; // 24h - Quran text is static

function rowToSurahSummary(row: {
  surah_number: number;
  slug: string;
  name_arabic: string;
  name_latin: string;
  name_bosnian: string;
  revelation_type: string;
  ayah_count: number;
}): SurahSummary {
  return {
    id: String(row.surah_number),
    surahNumber: row.surah_number,
    slug: row.slug,
    nameArabic: row.name_arabic,
    nameLatin: row.name_latin,
    nameBosnian: row.name_bosnian,
    revelationType: row.revelation_type as "meccan" | "medinan",
    ayahCount: row.ayah_count,
  };
}

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("surahs")
      .select("surah_number, slug, name_arabic, name_latin, name_bosnian, revelation_type, ayah_count")
      .order("surah_number", { ascending: true });

    if (error) {
      console.error("API surahs:", error);
      return NextResponse.json(
        { error: "Failed to fetch surahs" },
        { status: 500 }
      );
    }

    const surahs: SurahSummary[] = (data ?? []).map(rowToSurahSummary);
    return NextResponse.json(
      { surahs },
      {
        headers: {
          "Cache-Control": "public, max-age=" + CACHE_MAX_AGE,
        },
      }
    );
  } catch (e) {
    console.error("API surahs:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
