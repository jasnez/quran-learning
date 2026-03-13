"use client";

import Link from "next/link";
import { useState } from "react";
import { getBrowserClientAsync } from "@/lib/auth/authHelpers";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const client = await getBrowserClientAsync();
    const { error: signInError } = await client.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (signInError) {
      const msg = signInError.message ?? "Neuspješna prijava. Provjeri podatke.";
      const isInvalidKey =
        /invalid api key|invalid api_key|Invalid API key/i.test(msg);
      setError(
        isInvalidKey
          ? "Pogrešna konfiguracija (API ključ). Provjeri u .env.local: NEXT_PUBLIC_SUPABASE_URL i NEXT_PUBLIC_SUPABASE_ANON_KEY (Supabase Dashboard → Settings → API)."
          : msg
      );
      return;
    }
    setMessage("Dobro došao nazad! Učitavamo tvoj nalog…");
  };

  const handleGoogle = async () => {
    const client = await getBrowserClientAsync();
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/`
        : undefined;
    await client.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });
  };

  return (
    <div className="flex min-h-[calc(100vh-6rem)] items-center justify-center bg-gradient-to-b from-emerald-50/60 via-white to-amber-50/40 px-4 py-10 dark:from-slate-950 dark:via-slate-950 dark:to-emerald-950/10">
      <div className="w-full max-w-md rounded-3xl border border-[var(--theme-border)] bg-[var(--theme-card)]/90 p-8 shadow-[0_18px_45px_rgba(15,23,42,0.16)] backdrop-blur-md">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-300">
            Quran Learning
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-stone-900 dark:text-stone-50">
            Prijava
          </h1>
          <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
            Nastavi tamo gdje si stao, uz svoje zabilješke i napredak.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-stone-700 dark:text-stone-200"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[var(--theme-border)] bg-white/90 px-3 py-2.5 text-sm text-stone-900 shadow-sm outline-none ring-emerald-500/0 transition focus:ring-2 dark:bg-stone-900/80 dark:text-stone-50"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-stone-700 dark:text-stone-200"
            >
              Lozinka
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[var(--theme-border)] bg-white/90 px-3 py-2.5 text-sm text-stone-900 shadow-sm outline-none ring-emerald-500/0 transition focus:ring-2 dark:bg-stone-900/80 dark:text-stone-50"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          {message && !error && (
            <p className="text-sm text-emerald-700 dark:text-emerald-300">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Prijavljivanje…" : "Prijavi se"}
          </button>
        </form>

        <div className="mt-5 space-y-3">
          <button
            type="button"
            onClick={handleGoogle}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--theme-border)] bg-white/70 px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50 dark:bg-stone-900/60 dark:text-stone-100 dark:hover:bg-stone-900"
          >
            <span>Prijava putem Google naloga</span>
          </button>

          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
            <Link href="/auth/forgot-password" className="hover:text-emerald-700">
              Zaboravljena lozinka
            </Link>
            <div className="flex gap-1">
              <span>Nemaš račun?</span>
              <Link
                href="/auth/register"
                className="font-medium text-emerald-700 hover:text-emerald-800"
              >
                Kreiraj račun
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

