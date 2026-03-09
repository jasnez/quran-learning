import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Reciter } from "@/types/quran";

const CACHE_MAX_AGE = 86400;
const DEFAULT_RECITER_ID = "mishary-alafasy";

function rowToReciter(row: {
  id: string;
  name: string;
  arabic_name: string | null;
}): Reciter {
  return {
    id: row.id,
    name: row.name,
    arabicName: row.arabic_name ?? "",
    isDefault: row.id === DEFAULT_RECITER_ID,
  };
}

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("reciters")
      .select("id, name, arabic_name")
      .eq("is_active", true);

    if (error) {
      console.error("API reciters:", error);
      return NextResponse.json(
        { error: "Failed to fetch reciters" },
        { status: 500 }
      );
    }

    const reciters: Reciter[] = (data ?? []).map(rowToReciter);
    return NextResponse.json(
      { reciters },
      {
        headers: {
          "Cache-Control": "public, max-age=" + CACHE_MAX_AGE,
        },
      }
    );
  } catch (e) {
    console.error("API reciters:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
