/**
 * Client-side search over public/data/search-index.json (3 MB pre-built corpus
 * with Arabic, transliteration, Bosnian translation, and surah names for all
 * 6,236 ayahs). Fetched once on demand, cached in module scope.
 *
 * Used in place of a server-side /api/search route for static-export builds.
 *
 * Features:
 * - Diacritic-insensitive matching for Latin (Bosnian + transliteration):
 *   "Allah" matches "Allāh", "Rahman" matches "raḥmān", "ime" matches "Imê".
 * - Diacritic-insensitive matching for Arabic: tashkeel stripped, alef
 *   variants unified, so "الله" matches "ٱللَّهِ".
 * - Reference search: "2:255" jumps to exact ayah; "yasin" matches surah names.
 * - Result ranking: ayah-reference > surah-name > Arabic > Bosnian
 *   translation > transliteration. Position-0 matches get a small boost.
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

// Relevance scores (higher = more relevant)
const SCORE_AYAH_REFERENCE = 1000;
const SCORE_SURAH_NAME_EXACT = 800;
const SCORE_SURAH_NAME_PARTIAL = 500;
const SCORE_ARABIC = 200;
const SCORE_TRANSLATION = 150;
const SCORE_TRANSLITERATION = 100;
const POSITION_BOOST = 50;

let indexPromise: Promise<IndexSurah[]> | null = null;

function loadIndex(signal?: AbortSignal): Promise<IndexSurah[]> {
  if (indexPromise) return indexPromise;
  indexPromise = fetch(SEARCH_INDEX_URL, { signal }).then(async (res) => {
    if (!res.ok) {
      indexPromise = null;
      throw new Error(`Failed to load search index: ${res.status}`);
    }
    return (await res.json()) as IndexSurah[];
  });
  return indexPromise;
}

/** Strip Latin combining diacritics and lowercase. "Allāh" → "allah". */
export function normalizeLatin(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/**
 * Normalize Arabic for search:
 * - Strip tashkeel (fatha/kasra/damma/sukun/shadda/tanwin)
 * - Strip Quranic marks (small alef, hamza waṣla overlays)
 * - Strip tatweel (ـ)
 * - Unify alef variants (آ أ إ ٱ) → ا
 * - Unify ى → ي
 * "ٱللَّهِ" → "الله"
 */
export function normalizeArabic(s: string): string {
  return s
    .replace(/[ً-ْٰٓ-ٟۖ-ۭ]/g, "")
    .replace(/ـ/g, "")
    .replace(/[ٱأإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .trim();
}

function isArabicQuery(q: string): boolean {
  return /[؀-ۿ]/.test(q);
}

/** Parse "2:255" / "2 255" / "2/255" as surah:ayah reference. */
function parseAyahReference(q: string): { surah: number; ayah: number } | null {
  const m = q.trim().match(/^(\d{1,3})\s*[:\s/]\s*(\d{1,3})$/);
  if (!m) return null;
  const surah = parseInt(m[1], 10);
  const ayah = parseInt(m[2], 10);
  if (surah < 1 || surah > 114 || ayah < 1) return null;
  return { surah, ayah };
}

function buildSnippet(
  fullText: string,
  matchIdx: number,
  matchLen: number,
  maxLen: number,
): { snippet: string; snippetHighlight: string } {
  if (matchIdx < 0 || matchLen === 0) {
    const plain = fullText.slice(0, maxLen);
    return { snippet: plain, snippetHighlight: plain };
  }
  const start = Math.max(0, matchIdx - Math.floor(maxLen / 3));
  const end = Math.min(fullText.length, start + maxLen);
  const segment = fullText.slice(start, end);
  const inSegmentStart = matchIdx - start;
  const inSegmentEnd = Math.min(segment.length, inSegmentStart + matchLen);
  const before = segment.slice(0, inSegmentStart);
  const match = segment.slice(inSegmentStart, inSegmentEnd);
  const after = segment.slice(inSegmentEnd);
  const snippetHighlight = `${before}<mark>${match}</mark>${after}`;
  return { snippet: segment, snippetHighlight };
}

/**
 * Find query in a string that has equal length pre/post normalization
 * (Latin: NFD-strip preserves base chars in the same positions; Arabic: our
 * replacements may shrink length, so we fall back to a search on the original
 * text using the normalized query if positions don't line up).
 */
function findIndex(original: string, normalized: string, qNorm: string): number {
  if (!qNorm) return -1;
  const idx = normalized.indexOf(qNorm);
  if (idx === -1) return -1;
  // Char positions in `normalized` and `original` line up for Latin NFD when
  // we only stripped combining marks (those are zero-width in display, but
  // present as separate code points after NFD). For our Arabic normalizer,
  // some chars are dropped so `idx` may be slightly off; cap at original
  // length and treat as approximate. Snippet quality > perfect alignment.
  return Math.min(idx, original.length - 1);
}

type Scored = { score: number; result: SearchResult };

export async function searchAyahs(
  query: string,
  options?: { signal?: AbortSignal },
): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const ref = parseAyahReference(trimmed);
  const isArabic = isArabicQuery(trimmed);
  const queryNorm = isArabic ? normalizeArabic(trimmed) : normalizeLatin(trimmed);
  if (!queryNorm && !ref) return [];

  const index = await loadIndex(options?.signal);
  const scored: Scored[] = [];

  // Strip hyphens/spaces so "Yasin" matches "Ya-Sin" surah name. Only applied
  // to surah-name comparison, not body text (where positions matter for snippets).
  const stripPunct = (s: string) => s.replace(/[\s\-_./,]/g, "");
  const queryStripped = stripPunct(queryNorm);

  for (const surah of index) {
    let surahNameScore = 0;
    if (!isArabic) {
      const nameLatinN = stripPunct(normalizeLatin(surah.nameLatin));
      const nameBosnianN = stripPunct(normalizeLatin(surah.nameBosnian));
      const slugN = stripPunct(surah.slug);
      if (
        nameLatinN === queryStripped ||
        nameBosnianN === queryStripped ||
        slugN === queryStripped
      ) {
        surahNameScore = SCORE_SURAH_NAME_EXACT;
      } else if (
        nameLatinN.includes(queryStripped) ||
        nameBosnianN.includes(queryStripped) ||
        slugN.includes(queryStripped)
      ) {
        surahNameScore = SCORE_SURAH_NAME_PARTIAL;
      }
    } else {
      const nameArabicN = normalizeArabic(surah.nameArabic);
      if (nameArabicN.includes(queryNorm)) {
        surahNameScore = SCORE_SURAH_NAME_PARTIAL;
      }
    }

    for (const ayah of surah.ayahs) {
      let best = { score: 0, idx: -1, len: 0, snippetSource: "" };

      // Ayah reference exact
      if (ref && ref.surah === surah.surahNumber && ref.ayah === ayah.ayahNumber) {
        best = {
          score: SCORE_AYAH_REFERENCE,
          idx: -1,
          len: 0,
          snippetSource:
            ayah.translationBosnian || ayah.transliteration || ayah.arabicText,
        };
      }

      if (!ref && isArabic) {
        const norm = normalizeArabic(ayah.arabicText);
        const idx = findIndex(ayah.arabicText, norm, queryNorm);
        if (idx >= 0) {
          const score = SCORE_ARABIC + (idx === 0 ? POSITION_BOOST : 0);
          if (score > best.score) {
            best = { score, idx, len: trimmed.length, snippetSource: ayah.arabicText };
          }
        }
      }

      if (!ref && !isArabic) {
        const tN = normalizeLatin(ayah.translationBosnian);
        const tIdx = findIndex(ayah.translationBosnian, tN, queryNorm);
        if (tIdx >= 0) {
          const score = SCORE_TRANSLATION + (tIdx === 0 ? POSITION_BOOST : 0);
          if (score > best.score) {
            best = {
              score,
              idx: tIdx,
              len: queryNorm.length,
              snippetSource: ayah.translationBosnian,
            };
          }
        }
        const tlN = normalizeLatin(ayah.transliteration);
        const tlIdx = findIndex(ayah.transliteration, tlN, queryNorm);
        if (tlIdx >= 0) {
          const score = SCORE_TRANSLITERATION + (tlIdx === 0 ? POSITION_BOOST : 0);
          if (score > best.score) {
            best = {
              score,
              idx: tlIdx,
              len: queryNorm.length,
              snippetSource: ayah.transliteration,
            };
          }
        }
      }

      // Surah-name hit anchors to first ayah of the surah (if it didn't already
      // match through content)
      if (
        surahNameScore > 0 &&
        ayah.ayahNumber === 1 &&
        surahNameScore > best.score
      ) {
        best = {
          score: surahNameScore,
          idx: -1,
          len: 0,
          snippetSource:
            ayah.translationBosnian || ayah.transliteration || ayah.arabicText,
        };
      }

      if (best.score === 0) continue;

      const { snippet, snippetHighlight } = buildSnippet(
        best.snippetSource,
        best.idx,
        best.len,
        SNIPPET_LEN,
      );
      const arabicSnippet =
        ayah.arabicText.length > ARABIC_SNIPPET_LEN
          ? ayah.arabicText.slice(0, ARABIC_SNIPPET_LEN) + "…"
          : ayah.arabicText;

      scored.push({
        score: best.score,
        result: {
          surahId: String(surah.surahNumber),
          surahName: surah.nameBosnian || surah.nameLatin,
          ayahNumber: ayah.ayahNumber,
          ayahId: `${surah.surahNumber}:${ayah.ayahNumber}`,
          snippet,
          snippetHighlight,
          arabicSnippet,
        },
      });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, MAX_RESULTS).map((s) => s.result);
}

/** Test-only utility to reset the cached index promise. */
export function __resetSearchIndexCacheForTests(): void {
  indexPromise = null;
}
