import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

/**
 * Test Supabase konekcije: GET /api/supabase-test
 * Vraća { data, error } za supabase.from("surahs").select("*")
 */
export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from("surahs").select("*");

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message, code: error.code },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, data, count: data?.length ?? 0 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
