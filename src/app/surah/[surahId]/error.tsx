"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function SurahError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Surah error:", error.message, error.digest);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12">
      <h1 className="text-xl font-semibold text-ink">
        Sura se nije učitala
      </h1>
      <p className="mt-2 max-w-md text-center text-sm text-ink-muted">
        Provjeri internet i pokušaj ponovo.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-ink-muted">
          Digest: {error.digest}
        </p>
      )}
      <div className="mt-8 flex gap-4">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-on-accent hover:bg-accent-hover"
        >
          Pokušaj ponovo
        </button>
        <Link
          href="/surahs"
          className="rounded-full border border-line-strong px-5 py-2.5 text-sm font-medium text-ink hover:bg-surface-sunken"
        >
          Sve sure
        </Link>
      </div>
    </div>
  );
}
