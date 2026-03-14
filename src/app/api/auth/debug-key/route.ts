import { NextResponse } from "next/server";

/**
 * GET /api/auth/debug-key
 * Na serveru poziva Supabase Auth /health s env keyem i vraća sirovi odgovor.
 * Koristi se samo za debug "Invalid API key" – vidiš koji key se koristi i što Supabase vraća.
 * Na produkciji možeš obrisati ili zaštititi ovu rutu.
 */
export async function GET() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  const keySource = serviceKey
    ? "service_role"
    : publishableKey
      ? "publishable"
      : anonKey
        ? "anon"
        : "none";
  const key = serviceKey || publishableKey || anonKey;

  if (!url || !key) {
    return NextResponse.json({
      ok: false,
      keyUsed: keySource,
      error: "URL ili key nedostaje na serveru.",
      hasUrl: !!url,
      hasServiceRole: !!serviceKey,
      hasPublishable: !!publishableKey,
      hasAnon: !!anonKey,
    });
  }

  try {
    const res = await fetch(`${url}/auth/v1/health`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    });
    const text = await res.text();
    let body: unknown = text;
    try {
      body = JSON.parse(text);
    } catch {
      // leave as text
    }

    return NextResponse.json({
      ok: res.ok,
      keyUsed: keySource,
      statusCode: res.status,
      supabaseResponse: body,
      message: res.ok
        ? "Key je prihvaćen od strane Supabase Auth. Ako signup i dalje ne radi, problem je negdje drugdje (npr. signUp payload)."
        : "Supabase je odbio key. Provjeri da URL i key dolaze iz istog projekta (Supabase Dashboard → Settings → API). Ako sve je točno, probaj generirati novi key u Dashboardu.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      ok: false,
      keyUsed: keySource,
      error: message,
    });
  }
}
