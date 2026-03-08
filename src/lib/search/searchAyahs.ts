import type { SearchResult } from "@/types/quran";
import { getAllSurahs, getSurahByNumber } from "@/lib/data";

const SNIPPET_LEN = 80;
const ARABIC_SNIPPET_LEN = 50;

/**
 * Builds a snippet with the matching portion wrapped in a marker for highlighting.
 * Returns { text: "before <mark>match</mark> after", plain: "before match after" }.
 */
function buildSnippet(
  fullText: string,
  query: string,
  maxLen: number
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
  let segment = fullText.slice(start, end);
  const matchStart = idx - start;
  const matchEnd = matchStart + query.trim().length;
  const before = segment.slice(0, matchStart);
  const match = segment.slice(matchStart, matchEnd);
  const after = segment.slice(matchEnd);
  const snippetHighlight = `${before}<mark>${match}</mark>${after}`;
  return { snippet: segment, snippetHighlight };
}

/**
 * Searches ayahs (and surah names) across all surahs that have loaded ayah data.
 * Matches query in: arabicText, transliteration, translationBosnian, nameArabic, nameLatin, nameBosnian.
 */
export function searchAyahs(query: string): SearchResult[] {
  const q = query.trim();
  if (!q) return [];

  const results: SearchResult[] = [];
  const surahs = getAllSurahs();
  const qLower = q.toLowerCase();

  for (const surah of surahs) {
    const detail = getSurahByNumber(surah.surahNumber);
    const { ayahs } = detail;
    if (ayahs.length === 0) continue;

    const surahName = surah.nameBosnian || surah.nameLatin;
    const surahSearchText = [
      surah.nameArabic,
      surah.nameLatin,
      surah.nameBosnian,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    for (const ayah of ayahs) {
      const arabic = ayah.arabicText || "";
      const trans = ayah.transliteration || "";
      const transBos = ayah.translationBosnian || "";
      const searchable = [
        arabic,
        trans,
        transBos,
        surahSearchText,
      ]
        .join(" ")
        .toLowerCase();

      if (!searchable.includes(qLower)) continue;

      let snippetText = transBos || trans || arabic;
      if (surahSearchText.includes(qLower) && !snippetText.toLowerCase().includes(qLower)) {
        snippetText = transBos || trans || arabic || surahName;
      }
      const { snippet, snippetHighlight } = buildSnippet(snippetText, q, SNIPPET_LEN);
      const arabicSnippet = arabic.length > ARABIC_SNIPPET_LEN
        ? arabic.slice(0, ARABIC_SNIPPET_LEN) + "…"
        : arabic;

      results.push({
        surahId: String(surah.surahNumber),
        surahName,
        ayahNumber: ayah.ayahNumber,
        ayahId: ayah.id,
        snippet,
        snippetHighlight,
        arabicSnippet,
      });
    }
  }

  return results;
}
