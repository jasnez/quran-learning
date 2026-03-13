import { NextResponse } from "next/server";

/**
 * GET /api/env-check
 * Provjera da li su Supabase env varijable učitane (ne otkriva ključeve).
 * Koristi se za debug "Invalid API key" – ako hasAnonKey i hasUrl jesu true
 * ali i dalje dobivaš Invalid API key, zamijeni anon key u .env.local
 * pravim ključem iz Supabase Dashboard → Settings → API → anon public.
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  const hasUrl = url.length > 0;
  const hasAnonKey = anonKey.length > 0;
  const isPlaceholder =
    anonKey === "your-anon-key-here" || anonKey.length < 50;
  const urlPreview = hasUrl
    ? url.replace(/^https?:\/\//, "").slice(0, 30) + "..."
    : "(nije postavljen)";

  return NextResponse.json({
    hasUrl,
    hasAnonKey,
    isPlaceholder,
    anonKeyLength: anonKey.length,
    urlPreview,
    message: !hasUrl
      ? "NEXT_PUBLIC_SUPABASE_URL nije postavljen. Dodaj u .env.local i restartaj dev server."
      : !hasAnonKey
        ? "NEXT_PUBLIC_SUPABASE_ANON_KEY nije postavljen. Dodaj u .env.local i restartaj dev server."
        : isPlaceholder
          ? "Anon key izgleda kao placeholder (your-anon-key-here ili prekratak). Zalijepi pravi anon public ključ iz Supabase Dashboard → Settings → API."
          : "Env je učitano. Ako i dalje vidiš Invalid API key, provjeri da je ključ 'anon public' (ne service_role) i da je iz istog projekta kao URL.",
  });
}
