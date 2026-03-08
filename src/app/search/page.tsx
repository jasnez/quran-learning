"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { searchAyahsAction } from "./actions";
import type { SearchResult } from "@/types/quran";

const PLACEHOLDER = "Pretraži ajete, sure, prijevod...";
const EMPTY_MESSAGE = "Nije pronađeno. Pokušajte sa drugim pojmom.";
const MIN_QUERY_LEN = 1;

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < MIN_QUERY_LEN) {
      setResults([]);
      setStatus("done");
      return;
    }
    setStatus("loading");
    const data = await searchAyahsAction(trimmed);
    setResults(data);
    setStatus("done");
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (value.trim().length >= MIN_QUERY_LEN) {
      runSearch(value);
    } else {
      setResults([]);
      setStatus("done");
    }
  };

  const showEmpty =
    (status === "idle" || status === "done") &&
    (query.trim().length < MIN_QUERY_LEN || results.length === 0);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-[800px] flex-col px-4 pb-24 md:pb-12">
      <div className="sticky top-0 z-40 -mx-4 bg-[var(--theme-bg)]/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-[var(--theme-bg)]/90 md:static md:py-8">
        <h1 className="sr-only">Pretraga</h1>
        <label htmlFor="search-input" className="sr-only">
          Pretraži ajete, sure i prijevod
        </label>
        <input
          id="search-input"
          type="search"
          value={query}
          onChange={handleChange}
          placeholder={PLACEHOLDER}
          autoComplete="off"
          className="w-full rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] py-4 pl-5 pr-12 text-base text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 dark:placeholder:text-stone-500"
          aria-describedby={showEmpty ? "search-empty" : undefined}
        />
      </div>

      <div className="flex-1 py-6">
        {status === "loading" && (
          <p className="text-center text-sm text-stone-500 dark:text-stone-400">
            Pretraga…
          </p>
        )}

        {showEmpty && (
          <p
            id="search-empty"
            className="text-center text-stone-500 dark:text-stone-400"
          >
            {EMPTY_MESSAGE}
          </p>
        )}

        {status === "done" && results.length > 0 && (
          <ul className="space-y-4 list-none" role="list">
            {results.map((r) => (
              <li key={r.ayahId}>
                <Link
                  href={`/surah/${r.surahId}#ayah-${r.surahId}-${r.ayahNumber}`}
                  className="block rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-4 transition-colors hover:border-emerald-500/50 hover:bg-stone-50 dark:hover:bg-stone-800/80 md:p-5"
                >
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-stone-600 dark:text-stone-400">
                    <span>{r.surahName}</span>
                    <span aria-hidden>·</span>
                    <span>Ajet {r.ayahNumber}</span>
                  </div>
                  <p
                    className="text-stone-700 dark:text-stone-300 [&_mark]:rounded [&_mark]:bg-amber-200 [&_mark]:px-0.5 [&_mark]:font-medium dark:[&_mark]:bg-amber-800/50"
                    dangerouslySetInnerHTML={{ __html: r.snippetHighlight }}
                  />
                  <p
                    className="mt-3 text-right font-arabic text-lg leading-relaxed text-stone-600 dark:text-stone-400"
                    dir="rtl"
                  >
                    {r.arabicSnippet}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
