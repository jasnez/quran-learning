/**
 * Client-side search over public/data/search-index.json (3 MB pre-built corpus
 * with Arabic, transliteration, Bosnian translation, and surah names for all
 * 6,236 ayahs). Fetched once on demand, cached in module scope.
 *
 * Used in place of a server-side /api/search route for static-export builds.
 */

import type { SearchResult } from "@/types/quran";

const SEARCH_INDEX_URL = "/data/search-index.json";

type IndexAyah = {
  ayahNumber: number;
  arabicText: string;
  transliteration: string;
  translationBosnian: string;
};

type IndexSurah = {
  surahNumber: number;
  slug: string;
  nameLatin: string;
  nameBosnian: string;
  nameArabic: string;
  ayahs: IndexAyah[];
};

const MAX_RESULTS = 50;
const SNIPPET_LEN = 80;
const ARABIC_SNIPPET_LEN = 50;

let indexPromise: Promise<IndexSurah[]> | null = null;

function loadIndex(signal?: AbortSignal): Promise<IndexSurah[]> {
  if (indexPromise) return indexPromise;
  indexPromise = fetch(SEARCH_INDEX_URL, { signal }).then(async (res) => {
    if (!res.ok) {
      // Bust the cache so a retry can re-fetch
      indexPromise = null;
      throw new Error(`Failed to load search index: ${res.status}`);
    }
    return (await res.json()) as IndexSurah[];
  });
  return indexPromise;
}

function buildSnippet(
  fullText: string,
  query: string,
  maxLen: number,
): { snippet: string; snippetHighlight: string } {
  if (!fullText || !query) {
    const plain = fullText.slice(0, maxLen);
    return { snippet: plain, snippetHighlight: plain };
  }
  const q = query.trim().toLowerCase();
  const lower = fullText.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx === -1) {
    const plain = fullText.slice(0, maxLen);
    return { snippet: plain, snippetHighlight: plain };
  }
  const start = Math.max(0, idx - Math.floor(maxLen / 3));
  const end = Math.min(fullText.length, start + maxLen);
  const segment = fullText.slice(start, end);
  const matchStart = idx - start;
  const matchEnd = matchStart + query.trim().length;
  const before = segment.slice(0, matchStart);
  const match = segment.slice(matchStart, matchEnd);
  const after = segment.slice(matchEnd);
  const snippetHighlight = `${before}<mark>${match}</mark>${after}`;
  return { snippet: segment, snippetHighlight };
}

export async function searchAyahs(
  query: string,
  options?: { signal?: AbortSignal },
): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const index = await loadIndex(options?.signal);
  const qLower = trimmed.toLowerCase();
  const results: SearchResult[] = [];

  outer: for (const surah of index) {
    for (const ayah of surah.ayahs) {
      const matchArabic = ayah.arabicText.toLowerCase().includes(qLower);
      const matchTrans = ayah.translationBosnian.toLowerCase().includes(qLower);
      const matchTransLit = ayah.transliteration.toLowerCase().includes(qLower);
      if (!matchArabic && !matchTrans && !matchTransLit) continue;

      const snippetText =
        ayah.translationBosnian || ayah.transliteration || ayah.arabicText;
      const { snippet, snippetHighlight } = buildSnippet(
        snippetText,
        trimmed,
        SNIPPET_LEN,
      );
      const arabicSnippet =
        ayah.arabicText.length > ARABIC_SNIPPET_LEN
          ? ayah.arabicText.slice(0, ARABIC_SNIPPET_LEN) + "…"
          : ayah.arabicText;

      results.push({
        surahId: String(surah.surahNumber),
        surahName: surah.nameBosnian || surah.nameLatin,
        ayahNumber: ayah.ayahNumber,
        ayahId: `${surah.surahNumber}:${ayah.ayahNumber}`,
        snippet,
        snippetHighlight,
        arabicSnippet,
      });

      if (results.length >= MAX_RESULTS) break outer;
    }
  }

  return results;
}

/** Test-only utility to reset the cached index promise. */
export function __resetSearchIndexCacheForTests(): void {
  indexPromise = null;
}
