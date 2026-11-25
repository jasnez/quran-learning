"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { searchAyahs } from "@/lib/search/searchClient";
import type { SearchResult } from "@/types/quran";
import { formatCount, formatNumber } from "@/lib/format";
import { stripWaqfSigns } from "@/lib/quran/stripWaqfSigns";

const PLACEHOLDER = "npr. milost, jasin ili 2:255";
const EMPTY_HINT = "Upiši riječ iz prijevoda, naziv sure ili broj ajeta (2:255). Može i arapskim pismom.";
const NO_RESULTS_MESSAGE = "Ništa nije pronađeno. Pokušaj s drugom riječju ili brojem ajeta.";
const MIN_QUERY_LEN_LATIN = 3;
const MIN_QUERY_LEN_ARABIC = 1;
const DEBOUNCE_MS = 300;
const RECENT_KEY = "quran-search-recent";
const RECENT_MAX = 5;
/** Results shown at first and added by each "Prikaži još" (QA P2-5). */
const PAGE_SIZE = 50;

const RESULT_FORMS = { one: "rezultat", few: "rezultata", other: "rezultata" } as const;

/** "1 rezultat", "21 rezultat", "2 rezultata", "11 rezultata". */
function resultCountLabel(shown: number, total: number): string {
  if (shown < total) return `Prikazano ${formatNumber(shown)} od ${formatNumber(total)} rezultata`;
  return formatCount(total, RESULT_FORMS);
}

// text-inherit: the browser's own mark text is black, unreadable on the dark-theme highlight.
const MARK_CLASSES =
  "[&_mark]:rounded [&_mark]:bg-mark [&_mark]:px-0.5 [&_mark]:font-medium [&_mark]:text-inherit";

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
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  /** How many results of which query are shown; a new query starts again from PAGE_SIZE. */
  const [shown, setShown] = useState({ query: "", count: PAGE_SIZE });
  const listRef = useRef<HTMLUListElement>(null);
  const linkRefsRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const LISTBOX_ID = "search-results-list";
  const getResultId = (idx: number) => `search-result-${idx}`;

  // SSR vraća [], pa se nakon mount-a čita localStorage. useEffect je ovdje potreban
  // da izbjegne hydration mismatch — lazy useState init bi razlikovao SSR i klijent.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration-safe sync s localStorage
    setRecentSearches(getRecent());
  }, []);

  // Debounce: ažurira debouncedQuery 300ms nakon što korisnik prestane tipkati
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const trimmed = debouncedQuery.trim();
  const isQueryLongEnough = trimmed.length >= getMinQueryLength(trimmed);

  // React Query: cache po upitu, automatski deduplicira iste zahtjeve
  const { data: allResults = [], isFetching } = useQuery<SearchResult[]>({
    queryKey: ["search", trimmed],
    queryFn: ({ signal }) => searchAyahs(trimmed, { signal }),
    enabled: isQueryLongEnough,
    staleTime: 2 * 60 * 1000, // rezultati svježi 2 minute
    placeholderData: (prev) => prev, // prikaži stare rezultate dok novi stižu
  });
  const visibleCount = shown.query === trimmed ? shown.count : PAGE_SIZE;
  const results = useMemo(() => allResults.slice(0, visibleCount), [allResults, visibleCount]);

  // Snimi upit u localStorage historiju (bez setState — state će se osvježiti kad
  // korisnik isprazni input ili klikne nedavnu pretragu).
  useEffect(() => {
    if (allResults.length > 0 && trimmed) {
      pushRecent(trimmed);
    }
  }, [allResults, trimmed]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset highlighta na nove rezultate
    setSelectedIndex(0);
  }, [allResults]);

  useEffect(() => {
    linkRefsRef.current = linkRefsRef.current.slice(0, results.length);
  }, [results.length]);

  // Focus stays in the input (combobox pattern): arrow keys only move
  // aria-activedescendant. Keep the highlighted option visible instead of
  // focusing it, which would close the mobile keyboard and swallow typing.
  const navigatedByKeyRef = useRef(false);
  useEffect(() => {
    if (!navigatedByKeyRef.current) return;
    navigatedByKeyRef.current = false;
    linkRefsRef.current[selectedIndex]?.scrollIntoView?.({ block: "nearest" });
  }, [selectedIndex]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (value.trim().length === 0) setRecentSearches(getRecent());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setQuery("");
      setDebouncedQuery("");
      setRecentSearches(getRecent());
      return;
    }
    if (results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      navigatedByKeyRef.current = true;
      setSelectedIndex((i) => (i + 1) % results.length);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      navigatedByKeyRef.current = true;
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

  const isLoading = isFetching && isQueryLongEnough;
  const showEmpty =
    !isLoading &&
    (query.trim().length < getMinQueryLength(query) || results.length === 0);
  const isEmptyInput = query.trim().length < getMinQueryLength(query);
  const emptyMessage = isEmptyInput ? EMPTY_HINT : NO_RESULTS_MESSAGE;
  const showRecent = query.trim().length === 0 && recentSearches.length > 0;
  const hasResults = results.length > 0 && isQueryLongEnough;

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-[800px] flex-col px-4 pb-24 md:pb-12">
      <div className="sticky top-[var(--app-header-offset)] z-sticky -mx-4 transition-[top] duration-sheet bg-paper/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-paper/90 md:static md:py-8">
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
          className="w-full rounded-2xl border border-line bg-surface py-4 pl-5 pr-12 text-base text-ink placeholder:text-ink-muted focus-visible:border-accent-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text"
          aria-describedby={showEmpty ? "search-empty" : undefined}
        />
        {showRecent && (
          <div data-recent-searches className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-ink-muted">Nedavno traženo</span>
            {recentSearches.map((term) => (
              <button
                key={term}
                type="button"
                className="rounded-lg bg-surface-sunken px-3 py-1.5 text-sm text-ink hover:bg-line"
                onClick={() => {
                  setQuery(term);
                  setDebouncedQuery(term);
                }}
              >
                {term}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 py-6">
        {isLoading && (
          <p className="text-center text-sm text-ink-muted">
            Pretraga…
          </p>
        )}

        {showEmpty && !showRecent && (
          <p
            id="search-empty"
            className="text-center text-ink-muted"
          >
            {emptyMessage}
          </p>
        )}

        {hasResults && (
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
                  className={`block rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-accent-text hover:bg-surface-sunken md:p-5 ${idx === selectedIndex ? "ring-2 ring-accent-text/50" : ""}`}
                >
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-ink-muted">
                    <span>{r.surahName}</span>
                    <span aria-hidden>·</span>
                    <span>Ajet {r.ayahNumber}</span>
                  </div>
                  {r.snippetScript === "arabic" ? (
                    // An Arabic match: the highlighted Arabic itself, once (QA P2-5).
                    <p
                      className={`text-right font-arabic text-xl leading-loose text-ink ${MARK_CLASSES}`}
                      dir="rtl"
                      lang="ar"
                      dangerouslySetInnerHTML={{ __html: stripWaqfSigns(r.snippetHighlight) }}
                    />
                  ) : (
                    <>
                      <p
                        className={`text-ink ${MARK_CLASSES}`}
                        dangerouslySetInnerHTML={{ __html: r.snippetHighlight }}
                      />
                      <p
                        className="mt-3 text-right font-arabic text-lg leading-relaxed text-ink-muted"
                        dir="rtl"
                        lang="ar"
                      >
                        {stripWaqfSigns(r.arabicSnippet)}
                      </p>
                    </>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}

        {hasResults && (
          <div className="mt-6 flex flex-col items-center gap-3">
            <p role="status" className="text-sm text-ink-muted">
              {resultCountLabel(results.length, allResults.length)}
            </p>
            {results.length < allResults.length && (
              <button
                type="button"
                onClick={() => setShown({ query: trimmed, count: visibleCount + PAGE_SIZE })}
                className="rounded-full border border-line px-5 py-2 text-sm font-medium text-ink hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text"
              >
                Prikaži još
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
