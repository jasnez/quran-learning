import { NextResponse } from "next/server";
import { getAllSurahDetails } from "@/lib/data/static-quran";
import type { SearchResult } from "@/types/quran";

const CACHE_MAX_AGE = 3600;
const MAX_RESULTS = 50;
const SNIPPET_LEN = 80;
const ARABIC_SNIPPET_LEN = 50;

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
  const segment = fullText.slice(start, end);
  const matchStart = idx - start;
  const matchEnd = matchStart + query.trim().length;
  const before = segment.slice(0, matchStart);
  const match = segment.slice(matchStart, matchEnd);
  const after = segment.slice(matchEnd);
  const snippetHighlight = `${before}<mark>${match}</mark>${after}`;
  return { snippet: segment, snippetHighlight };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (!q) {
    return NextResponse.json(
      { results: [], total: 0 },
      { headers: { "Cache-Control": "public, max-age=" + CACHE_MAX_AGE } }
    );
  }

  const qLower = q.toLowerCase();
  const details = await getAllSurahDetails();
  const results: SearchResult[] = [];

  outer: for (const { surah, ayahs } of details) {
    for (const ayah of ayahs) {
      const arabicMatch = ayah.arabicText.toLowerCase().includes(qLower);
      const translationMatch = ayah.translationBosnian.toLowerCase().includes(qLower);
      const transliterationMatch = ayah.transliteration.toLowerCase().includes(qLower);
      if (!arabicMatch && !translationMatch && !transliterationMatch) continue;

      const snippetText =
        ayah.translationBosnian || ayah.transliteration || ayah.arabicText;
      const { snippet, snippetHighlight } = buildSnippet(snippetText, q, SNIPPET_LEN);
      const arabicSnippet =
        ayah.arabicText.length > ARABIC_SNIPPET_LEN
          ? ayah.arabicText.slice(0, ARABIC_SNIPPET_LEN) + "…"
          : ayah.arabicText;

      results.push({
        surahId: String(surah.surahNumber),
        surahName: surah.nameBosnian || surah.nameLatin,
        ayahNumber: ayah.ayahNumber,
        ayahId: ayah.id,
        snippet,
        snippetHighlight,
        arabicSnippet,
      });

      if (results.length >= MAX_RESULTS) break outer;
    }
  }

  return NextResponse.json(
    { results, total: results.length },
    { headers: { "Cache-Control": "public, max-age=" + CACHE_MAX_AGE } }
  );
}
