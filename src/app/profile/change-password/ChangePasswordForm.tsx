"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { updatePassword } from "@/lib/auth/authHelpers";

const MIN_PASSWORD_LENGTH = 6;

export function ChangePasswordForm() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError("Lozinka mora imati najmanje 6 znakova.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Lozinke se ne podudaraju.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await updatePassword(newPassword);
    setLoading(false);

    if (updateError) {
      setError(updateError.message ?? "Ne možemo promijeniti lozinku. Pokušaj ponovo.");
      return;
    }
    router.push("/profile");
  };

  return (
    <div className="flex min-h-[calc(100vh-6rem)] items-center justify-center bg-gradient-to-b from-emerald-50/60 via-white to-amber-50/40 px-4 py-10 dark:from-slate-950 dark:via-slate-950 dark:to-emerald-950/10">
      <div className="w-full max-w-md rounded-3xl border border-[var(--theme-border)] bg-[var(--theme-card)]/90 p-8 shadow-[0_18px_45px_rgba(15,23,42,0.16)] backdrop-blur-md">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-300">
            Quran Learning
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-stone-900 dark:text-stone-50">
            Promijeni lozinku
          </h1>
          <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
            Unesi novu lozinku (najmanje 6 znakova).
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="new-password"
              className="block text-sm font-medium text-stone-700 dark:text-stone-200"
            >
              Nova lozinka
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[var(--theme-border)] bg-white/90 px-3 py-2.5 text-sm text-stone-900 shadow-sm outline-none ring-emerald-500/0 transition focus:ring-2 dark:bg-stone-900/80 dark:text-stone-50"
            />
          </div>
          <div>
            <label
              htmlFor="confirm-password"
              className="block text-sm font-medium text-stone-700 dark:text-stone-200"
            >
              Potvrdi novu lozinku
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[var(--theme-border)] bg-white/90 px-3 py-2.5 text-sm text-stone-900 shadow-sm outline-none ring-emerald-500/0 transition focus:ring-2 dark:bg-stone-900/80 dark:text-stone-50"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Spremanje…" : "Spremi novu lozinku"}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-center text-xs text-stone-500 dark:text-stone-400">
          <Link
            href="/profile"
            className="font-medium text-emerald-700 hover:text-emerald-800"
          >
            Natrag na profil
          </Link>
        </div>
      </div>
    </div>
  );
}
