"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function SearchError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Search error:", error.message, error.digest);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12">
      <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
        Greška pretrage
      </h1>
      <p className="mt-2 max-w-md text-center text-sm text-stone-600 dark:text-stone-400">
        Pretraga trenutno nije dostupna. Provjeri internet vezu i pokušaj ponovo.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-stone-500 dark:text-stone-500">
          Digest: {error.digest}
        </p>
      )}
      <div className="mt-8 flex gap-4">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500"
        >
          Pokušaj ponovo
        </button>
        <Link
          href="/"
          className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100 dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-800"
        >
          Na početnu
        </Link>
      </div>
    </div>
  );
}
