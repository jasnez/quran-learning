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

/** Strip Latin diacritics and lowercase, keeping whitespace. */
function foldLatin(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/** Strip Latin combining diacritics and lowercase. "Allāh" → "allah". */
export function normalizeLatin(s: string): string {
  return foldLatin(s).trim();
}

/**
 * Apostrophes a reader may type where the transliteration has its own signs for ayn and
 * hamza (which `normalizeLatin` drops): ' ` and the two typographic quotes.
 */
const TYPED_APOSTROPHES = new RegExp(`[${String.fromCodePoint(0x27, 0x60, 0x2018, 0x2019)}]`, "g");

/**
 * A surah name or slug as compared in search: no diacritics, no hyphens or spaces (so "Jasin"
 * finds "Jā-sīn"), no typed apostrophes (so "Ma'ida" finds "Maʼida"). Not for body text, where
 * positions matter for snippets. Names are the Pravila forms ("El-Beqare", "Bekara"); the slug
 * keeps the English form, so "baqarah" still finds "al-baqarah".
 */
export function normalizeSurahName(s: string): string {
  return normalizeLatin(s).replace(TYPED_APOSTROPHES, "").replace(/[\s\-_./,]/g, "");
}

/**
 * Transliteration as compared in search: besides the diacritics, the hyphen of the article
 * counts as a space, so "rabbil alemin" finds "rabbil-ʻālemīn".
 */
function foldTransliteration(s: string): string {
  return foldLatin(s).replace(/-/g, " ");
}

/**
 * Where a normalized query lies in the original transliteration. Normalizing drops characters
 * (the line below a letter, the signs for ayn and hamza), so a position in the normalized
 * text is not a position in the original: "naʻbudu" is 7 characters, "nabudu" is 6.
 */
function locateTransliteration(original: string, qNorm: string): { idx: number; len: number } | null {
  if (!qNorm) return null;
  let normalized = "";
  /** For every character of `normalized`: where the character it came from starts in `original`. */
  const origins: number[] = [];
  let offset = 0;
  for (const char of original) {
    const folded = foldTransliteration(char);
    for (let i = 0; i < folded.length; i++) origins.push(offset);
    normalized += folded;
    offset += char.length;
  }
  const at = normalized.indexOf(qNorm);
  if (at < 0) return null;
  const idx = origins[at];
  // The match ends where the next kept character starts: dropped marks stay with their letter.
  const afterMatch = at + qNorm.length;
  const end = afterMatch < origins.length ? origins[afterMatch] : original.length;
  return { idx, len: end - idx };
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
  // "na'budu" finds "naʻbudu": the transliteration has no apostrophes to match against.
  const queryTransliteration = isArabic ? "" : foldTransliteration(queryNorm.replace(TYPED_APOSTROPHES, "")).trim();

  const index = await loadIndex(options?.signal);
  const scored: Scored[] = [];

  const queryStripped = normalizeSurahName(queryNorm);

  for (const surah of index) {
    let surahNameScore = 0;
    if (!isArabic) {
      const nameLatinN = normalizeSurahName(surah.nameLatin);
      const nameBosnianN = normalizeSurahName(surah.nameBosnian);
      const slugN = normalizeSurahName(surah.slug);
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
        // The cheap test first; the exact position is only worked out for ayahs that match.
        const tlHit =
          queryTransliteration && foldTransliteration(ayah.transliteration).includes(queryTransliteration)
            ? locateTransliteration(ayah.transliteration, queryTransliteration)
            : null;
        if (tlHit) {
          const score = SCORE_TRANSLITERATION + (tlHit.idx === 0 ? POSITION_BOOST : 0);
          if (score > best.score) {
            best = {
              score,
              idx: tlHit.idx,
              len: tlHit.len,
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
          surahName: surah.nameLatin,
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
