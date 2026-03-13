"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/lib/auth/authHelpers";
import { deleteAccountAction } from "./actions";

export function DeleteAccountButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    const { error: err } = await deleteAccountAction();
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    setOpen(false);
    await signOut();
    router.push("/");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex flex-1 items-center justify-center rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
      >
        Obriši račun
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-title"
        >
          <div className="w-full max-w-sm rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-6 shadow-xl">
            <h2
              id="delete-account-title"
              className="text-lg font-semibold text-stone-900 dark:text-stone-50"
            >
              Obriši račun
            </h2>
            <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
              Jesi li siguran? Svi tvoji podaci (zabilješke, napredak, postavke) bit će trajno
              obrisani. Ovaj postupak je nepovratan.
            </p>
            {error && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
                {error}
              </p>
            )}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => !loading && setOpen(false)}
                disabled={loading}
                className="flex-1 rounded-xl border border-[var(--theme-border)] px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800"
              >
                Odustani
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 rounded-xl border border-red-600 bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-70"
              >
                {loading ? "Brisanje…" : "Obriši račun"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
