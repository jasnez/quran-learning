import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/auth/signup – registracija na serveru.
 * Koristi server env (NEXT_PUBLIC_SUPABASE_*), pa na Vercelu uvijek radi ispravno.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, redirectTo } = body as {
      email?: string;
      password?: string;
      redirectTo?: string;
    };

    if (!email || typeof email !== "string" || !password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Email i lozinka su obavezni." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Lozinka mora imati najmanje 6 znakova." },
        { status: 400 }
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url) {
      return NextResponse.json(
        { error: "Auth nije konfiguriran na serveru (nedostaje URL)." },
        { status: 503 }
      );
    }
    // service_role uvijek radi za Auth na serveru; anon na Vercelu ponekad javlja Invalid API key
    const key = serviceKey || anonKey;
    if (!key) {
      return NextResponse.json(
        { error: "Auth nije konfiguriran na serveru (dodaj SUPABASE_SERVICE_ROLE_KEY ili NEXT_PUBLIC_SUPABASE_ANON_KEY u Vercel env)." },
        { status: 503 }
      );
    }

    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
    });

    if (error) {
      const msg =
        /invalid api key|invalid api_key/i.test(error.message) && !serviceKey
          ? "Server koristi krivi API ključ. U Vercel → Settings → Environment Variables dodaj SUPABASE_SERVICE_ROLE_KEY (Supabase Dashboard → Settings → API → service_role) i napravi Redeploy."
          : error.message;
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    return NextResponse.json({ ok: true, user: data.user });
  } catch {
    return NextResponse.json(
      { error: "Nešto nije u redu. Pokušaj ponovo." },
      { status: 500 }
    );
  }
}
