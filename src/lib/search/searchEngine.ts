import type { EngineSearchResult, SearchMatchField } from "@/types/quran";
import type { SurahDetail } from "@/types/quran";
import { getSearchIndex } from "./searchIndex";

const MAX_RESULTS = 50;
const SNIPPET_RADIUS = 60;
const MARKER_OPEN = "<mark>";
const MARKER_CLOSE = "</mark>";

// Relevance scores (higher = better)
const SCORE_SURAH_EXACT = 100;
const SCORE_ARABIC = 80;
const SCORE_TRANSLATION = 50;
const SCORE_TRANSLITERATION = 50;

function normalizeLatin(s: string): string {
  return s.toLowerCase().trim();
}

function buildSnippet(
  fullText: string,
  query: string,
  queryLower: string,
  isArabic: boolean
): string {
  if (!fullText) return "";
  const searchIn = isArabic ? fullText : fullText.toLowerCase();
  const q = isArabic ? query.trim() : queryLower;
  const idx = searchIn.indexOf(q);
  if (idx === -1) return fullText.slice(0, SNIPPET_RADIUS);

  const start = Math.max(0, idx - Math.floor(SNIPPET_RADIUS / 2));
  const end = Math.min(
    fullText.length,
    start + SNIPPET_RADIUS + q.length
  );
  let segment = fullText.slice(start, end);
  const matchStartInSegment = idx - start;
  const matchEndInSegment = matchStartInSegment + (isArabic ? query.trim().length : q.length);
  const before = segment.slice(0, matchStartInSegment);
  const match = segment.slice(matchStartInSegment, matchEndInSegment);
  const after = segment.slice(matchEndInSegment);
  return `${before}${MARKER_OPEN}${match}${MARKER_CLOSE}${after}`;
}

function findMatches(
  detail: SurahDetail,
  query: string,
  queryLower: string,
  queryArabic: string
): EngineSearchResult[] {
  const results: EngineSearchResult[] = [];
  const { surah, ayahs } = detail;
  const surahNameLatin = surah.nameLatin || "";
  const surahNameBosnian = surah.nameBosnian || "";
  const surahNameArabic = surah.nameArabic || "";
  const surahMatchLatin =
    normalizeLatin(surahNameLatin).includes(queryLower) ||
    normalizeLatin(surahNameBosnian).includes(queryLower);
  const surahMatchArabic =
    queryArabic && surahNameArabic.includes(queryArabic);

  for (const ayah of ayahs) {
    const arabic = ayah.arabicText || "";
    const transliteration = ayah.transliteration || "";
    const translation = ayah.translationBosnian || "";
    const arabicMatch = queryArabic && arabic.includes(queryArabic);
    const transLitMatch =
      !queryArabic && normalizeLatin(transliteration).includes(queryLower);
    const transMatch =
      !queryArabic && normalizeLatin(translation).includes(queryLower);
    const surahMatch = surahMatchLatin || surahMatchArabic;

    type Candidate = { field: SearchMatchField; score: number; snippet: string };
    const candidates: Candidate[] = [];
    if (surahMatch) {
      candidates.push({
        field: "surah",
        score: SCORE_SURAH_EXACT,
        snippet: buildSnippet(
          surahNameLatin || surahNameBosnian,
          query,
          queryLower,
          false
        ),
      });
    }
    if (arabicMatch) {
      candidates.push({
        field: "arabic",
        score: SCORE_ARABIC,
        snippet: buildSnippet(arabic, query, queryLower, true),
      });
    }
    if (transMatch) {
      candidates.push({
        field: "translation",
        score: SCORE_TRANSLATION,
        snippet: buildSnippet(translation, query, queryLower, false),
      });
    }
    if (transLitMatch) {
      candidates.push({
        field: "transliteration",
        score: SCORE_TRANSLITERATION,
        snippet: buildSnippet(transliteration, query, queryLower, false),
      });
    }

    if (candidates.length === 0) continue;
    const best = candidates.reduce((a, b) => (a.score >= b.score ? a : b));
    results.push({
      surahNumber: surah.surahNumber,
      surahNameLatin,
      surahNameArabic,
      ayahNumber: ayah.ayahNumber,
      matchField: best.field,
      matchSnippet: best.snippet,
      arabicText: arabic,
      score: best.score,
    });
  }

  return results;
}

/**
 * Searches across all loaded surah data.
 * Returns up to 50 results sorted by score (descending).
 */
export function searchAyahs(query: string): EngineSearchResult[] {
  const raw = query.trim();
  if (!raw) return [];

  const queryLower = normalizeLatin(query);
  const queryArabic = /[\u0600-\u06FF]/.test(raw) ? raw.trim() : "";

  const index = getSearchIndex();
  const all: EngineSearchResult[] = [];

  for (const detail of index) {
    const matches = findMatches(detail, raw, queryLower, queryArabic);
    all.push(...matches);
  }

  all.sort((a, b) => b.score - a.score);
  return all.slice(0, MAX_RESULTS);
}
