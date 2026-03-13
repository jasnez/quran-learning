"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getBrowserClientAsync } from "@/lib/auth/authHelpers";

export default function ConfirmEmailPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null | "loading">("loading");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getBrowserClientAsync().then((client) => {
      return client.auth.getUser().then(({ data }) => {
        const u = data?.user ?? null;
        setUser(u ?? null);
        if (!u) {
          router.replace("/auth/login");
          return;
        }
        if (u.email_confirmed_at) {
          router.replace("/profile");
        }
      });
    });
  }, [router]);

  const handleResend = async () => {
    if (!user || user === "loading" || !user.email) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    const client = await getBrowserClientAsync();
    const { error: resendError } = await client.auth.resend({
      type: "signup",
      email: user.email,
    });
    setLoading(false);
    if (resendError) {
      setError(resendError.message ?? "Ne možemo poslati link. Pokušaj ponovo.");
      return;
    }
    setMessage("Link za potvrdu je poslan na tvoj email. Provjeri i spam mapu.");
  };

  if (user === "loading" || !user) {
    return (
      <div className="flex min-h-[calc(100vh-6rem)] items-center justify-center px-4">
        <p className="text-sm text-stone-500">Učitavanje…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-6rem)] items-center justify-center bg-gradient-to-b from-emerald-50/60 via-white to-amber-50/40 px-4 py-10 dark:from-slate-950 dark:via-slate-950 dark:to-emerald-950/10">
      <div className="w-full max-w-md rounded-3xl border border-[var(--theme-border)] bg-[var(--theme-card)]/90 p-8 shadow-[0_18px_45px_rgba(15,23,42,0.16)] backdrop-blur-md">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-300">
            Quran Learning
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-stone-900 dark:text-stone-50">
            Potvrdi svoj email
          </h1>
          <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
            Poslali smo ti link za potvrdu na <strong>{user.email}</strong>. Otvori email i klikni na
            link da aktiviraš račun. Ako nisi primio, možeš zatražiti novi link ispod.
          </p>
        </div>

        {error && (
          <p className="mb-4 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
        {message && !error && (
          <p className="mb-4 text-sm text-emerald-700 dark:text-emerald-300">{message}</p>
        )}

        <button
          type="button"
          onClick={handleResend}
          disabled={loading}
          className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-70"
        >
          {loading ? "Slanje…" : "Pošalji ponovo link za potvrdu"}
        </button>

        <div className="mt-5 flex justify-center text-xs text-stone-500 dark:text-stone-400">
          <Link
            href="/auth/login"
            className="font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
          >
            Natrag na prijavu
          </Link>
        </div>
      </div>
    </div>
  );
}
