import { NextResponse } from "next/server";

/**
 * GET /api/auth-config
 * Vraća Supabase URL i anon key s servera. Koristi se na produkciji kada
 * NEXT_PUBLIC_* nisu u buildu (client dobiva config u runtime umjesto build time).
 * Anon key je javan; ovo samo omogućuje ispravan key na Vercelu bez redeploya.
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  if (!url || !anonKey) {
    return NextResponse.json(
      { error: "Auth config not available" },
      { status: 503 }
    );
  }

  return NextResponse.json({ url, anonKey });
}
