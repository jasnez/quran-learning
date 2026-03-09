"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { searchAyahs } from "@/lib/api/client";
import type { SearchResult } from "@/types/quran";

const PLACEHOLDER = "Pretraži ajete, sure, prijevod...";
const EMPTY_HINT = "Unesite pojam za pretragu (npr. Milostivog, Allah).";
const NO_RESULTS_MESSAGE = "Nije pronađeno. Pokušajte sa drugim pojmom.";
const MIN_QUERY_LEN_LATIN = 3;
const MIN_QUERY_LEN_ARABIC = 1;
const DEBOUNCE_MS = 300;
const RECENT_KEY = "quran-search-recent";
const RECENT_MAX = 5;

/** Minimum number of characters to run search. Latin script: 3 to reduce noise; Arabic: 1. */
function getMinQueryLength(q: string): number {
  const trimmed = q.trim();
  if (!trimmed) return MIN_QUERY_LEN_LATIN;
  const hasArabic = /[\u0600-\u06FF]/.test(trimmed);
  return hasArabic ? MIN_QUERY_LEN_ARABIC : MIN_QUERY_LEN_LATIN;
}

function getRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
}

function pushRecent(query: string) {
  if (!query.trim()) return;
  const prev = getRecent().filter((q) => q.trim().toLowerCase() !== query.trim().toLowerCase());
  const next = [query.trim(), ...prev].slice(0, RECENT_MAX);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const linkRefsRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const LISTBOX_ID = "search-results-list";
  const getResultId = (idx: number) => `search-result-${idx}`;

  useEffect(() => {
    setRecentSearches(getRecent());
  }, []);

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    const minLen = getMinQueryLength(trimmed);
    if (trimmed.length < minLen) {
      setResults([]);
      setStatus("done");
      return;
    }
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setStatus("loading");
    try {
      const data = await searchAyahs(trimmed, { signal: controller.signal });
      if (controller.signal.aborted) return;
      setResults(data);
      setStatus("done");
      setSelectedIndex(0);
      if (data.length > 0) pushRecent(trimmed);
      setRecentSearches(getRecent());
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setResults([]);
      setStatus("done");
    } finally {
      if (abortControllerRef.current === controller) abortControllerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    if (value.trim().length < getMinQueryLength(value)) {
      setResults([]);
      setStatus("done");
      setRecentSearches(getRecent());
      return;
    }

    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      runSearch(value);
    }, DEBOUNCE_MS);
  };

  useEffect(() => {
    linkRefsRef.current = linkRefsRef.current.slice(0, results.length);
  }, [results.length]);

  useEffect(() => {
    if (selectedIndex >= 0 && selectedIndex < results.length) {
      linkRefsRef.current[selectedIndex]?.focus();
    }
  }, [selectedIndex, results.length]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setQuery("");
      setResults([]);
      setStatus("idle");
      setRecentSearches(getRecent());
      return;
    }
    if (results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => (i + 1) % results.length);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => (i - 1 + results.length) % results.length);
      return;
    }
    if (e.key === "Enter") {
      const link = linkRefsRef.current[selectedIndex];
      if (link?.href) {
        e.preventDefault();
        router.push(link.getAttribute("href") ?? link.href);
      }
    }
  };

  const showEmpty =
    (status === "idle" || status === "done") &&
    (query.trim().length < getMinQueryLength(query) || results.length === 0);
  const isEmptyInput = query.trim().length < getMinQueryLength(query);
  const emptyMessage = isEmptyInput ? EMPTY_HINT : NO_RESULTS_MESSAGE;
  const showRecent = query.trim().length === 0 && recentSearches.length > 0;
  const hasResults = results.length > 0;

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
          onKeyDown={handleKeyDown}
          placeholder={PLACEHOLDER}
          autoComplete="off"
          role="combobox"
          aria-expanded={hasResults}
          aria-controls={LISTBOX_ID}
          aria-activedescendant={hasResults && results[selectedIndex] ? getResultId(selectedIndex) : undefined}
          aria-autocomplete="list"
          className="w-full rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] py-4 pl-5 pr-12 text-base text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 dark:placeholder:text-stone-500"
          aria-describedby={showEmpty ? "search-empty" : undefined}
        />
        {showRecent && (
          <div data-recent-searches className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-stone-500 dark:text-stone-400">Nedavne pretrage:</span>
            {recentSearches.map((term) => (
              <button
                key={term}
                type="button"
                className="rounded-lg bg-stone-100 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-200 dark:bg-stone-700 dark:text-stone-300 dark:hover:bg-stone-600"
                onClick={() => {
                  setQuery(term);
                  runSearch(term);
                }}
              >
                {term}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 py-6">
        {status === "loading" && (
          <p className="text-center text-sm text-stone-500 dark:text-stone-400">
            Pretraga…
          </p>
        )}

        {showEmpty && !showRecent && (
          <p
            id="search-empty"
            className="text-center text-stone-500 dark:text-stone-400"
          >
            {emptyMessage}
          </p>
        )}

        {status === "done" && results.length > 0 && (
          <ul
            id={LISTBOX_ID}
            ref={listRef}
            className="space-y-4 list-none"
            role="listbox"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            aria-label="Rezultati pretrage"
          >
            {results.map((r, idx) => (
              <li key={r.ayahId} id={getResultId(idx)} role="option" aria-selected={idx === selectedIndex}>
                <Link
                  ref={(el) => { linkRefsRef.current[idx] = el; }}
                  href={`/surah/${r.surahId}?ayah=${r.ayahNumber}#ayah-${r.surahId}-${r.ayahNumber}`}
                  className={`block rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-4 transition-colors hover:border-emerald-500/50 hover:bg-stone-50 dark:hover:bg-stone-800/80 md:p-5 ${idx === selectedIndex ? "ring-2 ring-emerald-500/50" : ""}`}
                >
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-stone-600 dark:text-stone-400">
                    <span>{r.surahName}</span>
                    <span aria-hidden>·</span>
                    <span>Ajet {r.ayahNumber}</span>
                  </div>
                  <p
                    className="text-stone-700 dark:text-stone-300 [&_mark]:rounded [&_mark]:bg-amber-100 [&_mark]:px-0.5 [&_mark]:font-medium dark:[&_mark]:bg-amber-900/40"
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
