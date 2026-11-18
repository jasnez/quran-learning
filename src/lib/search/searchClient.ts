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
 * - Every match is returned; the search page shows them 50 at a time.
 */

import type { SearchResult, SnippetScript } from "@/types/quran";

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

const SNIPPET_LEN = 80;
/** The Arabic preview under a Latin snippet. */
const ARABIC_SNIPPET_LEN = 50;
/** An Arabic match; harakat make up about half of the characters. */
const ARABIC_MATCH_SNIPPET_LEN = 100;

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
 * Where a normalized query lies in the original text, `fold` being the normalization, applied
 * one character at a time. Normalizing drops characters (the line below a letter, the signs
 * for ayn and hamza, the harakat), so a position in the normalized text is not a position in
 * the original: "naʻbudu" is 7 characters, "nabudu" is 6.
 */
function locateFolded(
  original: string,
  qNorm: string,
  fold: (char: string) => string,
): { idx: number; len: number } | null {
  if (!qNorm) return null;
  let normalized = "";
  /** For every character of `normalized`: where the character it came from starts in `original`. */
  const origins: number[] = [];
  let offset = 0;
  for (const char of original) {
    const folded = fold(char);
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
  return foldArabic(s).trim();
}

/** `normalizeArabic` without the trim, so it can be applied one character at a time. */
function foldArabic(s: string): string {
  return s
    .replace(/[ً-ْٰٓ-ٟۖ-ۭ]/g, "")
    .replace(/ـ/g, "")
    .replace(/[ٱأإآ]/g, "ا")
    .replace(/ى/g, "ي");
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

type Span = { start: number; end: number };

function wordSpans(text: string): Span[] {
  return Array.from(text.matchAll(/\S+/g), (m) => ({ start: m.index, end: m.index + m[0].length }));
}

/**
 * A snippet of at most `maxLen` characters around the match, cut only between words, with "…"
 * where words are left out (QA P2-5). Without a match (`matchIdx` -1) it is the start of the
 * text. `script` "arabic" widens the mark to whole words: a mark inside an Arabic word would
 * break its joined letters. A Latin mark covers just the matched letters.
 */
function buildSnippet(
  text: string,
  matchIdx: number,
  matchLen: number,
  maxLen: number,
  script: SnippetScript,
): { snippet: string; snippetHighlight: string } {
  const words = wordSpans(text);
  if (words.length === 0) return { snippet: "", snippetHighlight: "" };
  const hasMatch = matchIdx >= 0 && matchLen > 0;
  const first = hasMatch ? words.findIndex((w) => w.end > matchIdx) : 0;
  const last = hasMatch ? words.findLastIndex((w) => w.start < matchIdx + matchLen) : 0;
  const width = (a: number, b: number) => words[b].end - words[a].start;

  let lo = first;
  let hi = last;
  // Up to a third of the room before the match...
  while (lo > 0 && width(lo - 1, hi) <= maxLen && words[first].start - words[lo - 1].start <= maxLen / 3) lo--;
  while (hi < words.length - 1 && width(lo, hi + 1) <= maxLen) hi++;
  // ...and whatever the end of the ayah leaves over.
  while (lo > 0 && width(lo - 1, hi) <= maxLen) lo--;

  const lead = lo > 0 ? "… " : "";
  const tail = hi < words.length - 1 ? " …" : "";
  const snippet = `${lead}${text.slice(words[lo].start, words[hi].end)}${tail}`;
  if (!hasMatch) return { snippet, snippetHighlight: snippet };
  const markStart = script === "arabic" ? words[first].start : matchIdx;
  const markEnd = script === "arabic" ? words[last].end : matchIdx + matchLen;
  const before = text.slice(words[lo].start, markStart);
  const match = text.slice(markStart, markEnd);
  const after = text.slice(markEnd, words[hi].end);
  return { snippet, snippetHighlight: `${lead}${before}<mark>${match}</mark>${after}${tail}` };
}

/**
 * Find query in the translation: in its NFC text, NFD-stripping keeps every base character in
 * its place, so a position in the normalized text is a position in the original.
 */
function findIndex(normalized: string, qNorm: string): number {
  if (!qNorm) return -1;
  return normalized.indexOf(qNorm);
}

/** Snippet source for a hit without a position in the text (ayah reference, surah name). */
function plainSource(ayah: IndexAyah): { snippetSource: string; script: SnippetScript } {
  const latin = ayah.translationBosnian || ayah.transliteration;
  return latin ? { snippetSource: latin, script: "latin" } : { snippetSource: ayah.arabicText, script: "arabic" };
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
      let best: { score: number; idx: number; len: number; snippetSource: string; script: SnippetScript } = {
        score: 0,
        idx: -1,
        len: 0,
        snippetSource: "",
        script: "latin",
      };

      // Ayah reference exact
      if (ref && ref.surah === surah.surahNumber && ref.ayah === ayah.ayahNumber) {
        best = { score: SCORE_AYAH_REFERENCE, idx: -1, len: 0, ...plainSource(ayah) };
      }

      if (!ref && isArabic) {
        // The cheap test first; the exact position is only worked out for ayahs that match.
        const hit = normalizeArabic(ayah.arabicText).includes(queryNorm)
          ? locateFolded(ayah.arabicText, queryNorm, foldArabic)
          : null;
        if (hit) {
          const score = SCORE_ARABIC + (hit.idx === 0 ? POSITION_BOOST : 0);
          if (score > best.score) {
            best = { score, idx: hit.idx, len: hit.len, snippetSource: ayah.arabicText, script: "arabic" };
          }
        }
      }

      if (!ref && !isArabic) {
        const tN = normalizeLatin(ayah.translationBosnian);
        const tIdx = findIndex(tN, queryNorm);
        if (tIdx >= 0) {
          const score = SCORE_TRANSLATION + (tIdx === 0 ? POSITION_BOOST : 0);
          if (score > best.score) {
            best = {
              score,
              idx: tIdx,
              len: queryNorm.length,
              snippetSource: ayah.translationBosnian,
              script: "latin",
            };
          }
        }
        // The cheap test first; the exact position is only worked out for ayahs that match.
        const tlHit =
          queryTransliteration && foldTransliteration(ayah.transliteration).includes(queryTransliteration)
            ? locateFolded(ayah.transliteration, queryTransliteration, foldTransliteration)
            : null;
        if (tlHit) {
          const score = SCORE_TRANSLITERATION + (tlHit.idx === 0 ? POSITION_BOOST : 0);
          if (score > best.score) {
            best = {
              score,
              idx: tlHit.idx,
              len: tlHit.len,
              snippetSource: ayah.transliteration,
              script: "latin",
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
        // A match in the text keeps its snippet and mark; only its rank rises.
        best =
          best.score > 0
            ? { ...best, score: surahNameScore }
            : { score: surahNameScore, idx: -1, len: 0, ...plainSource(ayah) };
      }

      if (best.score === 0) continue;

      const { snippet, snippetHighlight } = buildSnippet(
        best.snippetSource,
        best.idx,
        best.len,
        best.script === "arabic" ? ARABIC_MATCH_SNIPPET_LEN : SNIPPET_LEN,
        best.script,
      );
      const arabicSnippet = buildSnippet(ayah.arabicText, -1, 0, ARABIC_SNIPPET_LEN, "arabic").snippet;

      scored.push({
        score: best.score,
        result: {
          surahId: String(surah.surahNumber),
          surahName: surah.nameLatin,
          ayahNumber: ayah.ayahNumber,
          ayahId: `${surah.surahNumber}:${ayah.ayahNumber}`,
          snippet,
          snippetHighlight,
          snippetScript: best.script,
          arabicSnippet,
        },
      });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.result);
}

/** Test-only utility to reset the cached index promise. */
export function __resetSearchIndexCacheForTests(): void {
  indexPromise = null;
}
