import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/auth-test
 * Testira Supabase Auth s anon ključem na serveru.
 * Ako ovdje dobiješ "Invalid API key", problem je u ključu ili projektu.
 * Ako ovdje radi, a na stranici Kreiraj račun ne radi, problem je cache u pregledniku.
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.json(
      { ok: false, error: "Missing NEXT_PUBLIC_SUPABASE_URL or ANON_KEY" },
      { status: 500 }
    );
  }

  const supabase = createClient(url, anonKey, { auth: { persistSession: false } });

  // Samo provjera da Auth API prihvaća ključ (getSession bez tokena)
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message, code: error.name },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Auth API prihvaća anon ključ (server-side). Ako registracija u browseru i dalje ne radi, očisti cache (.next + hard refresh ili InPrivate prozor).",
    session: data.session ? "postoji" : "nema",
  });
}
