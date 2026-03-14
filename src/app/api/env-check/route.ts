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
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "";
  const hasServiceRole = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").length > 0;

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
    hasServiceRole,
    isPlaceholder,
    anonKeyLength: anonKey.length,
    urlPreview,
    message: !hasUrl
      ? "NEXT_PUBLIC_SUPABASE_URL nije postavljen. Dodaj u .env.local i restartaj dev server."
      : !hasAnonKey
        ? "NEXT_PUBLIC_SUPABASE_ANON_KEY ili NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY nije postavljen."
        : isPlaceholder
          ? "Anon/Publishable key izgleda kao placeholder. Zalijepi pravi ključ iz Supabase Dashboard → Settings → API. Za signup na produkciji dodaj SUPABASE_SERVICE_ROLE_KEY."
          : !hasServiceRole
            ? "Za 'Kreiraj račun' na Vercelu dodaj SUPABASE_SERVICE_ROLE_KEY (Settings → API → service_role), pa Redeploy. Vidi docs/AUTH-SETUP.md."
            : "Env je učitano. Ako i dalje vidiš Invalid API key, provjeri docs/AUTH-SETUP.md (URL i ključ iz istog projekta).",
  });
}
