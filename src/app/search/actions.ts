"use server";

import { searchAyahs } from "@/lib/search/searchEngine";
import type { SearchResult } from "@/types/quran";

const ARABIC_SNIPPET_MAX = 50;

export async function searchAyahsAction(query: string): Promise<SearchResult[]> {
  const engineResults = searchAyahs(query);
  return engineResults.map((r) => ({
    surahId: String(r.surahNumber),
    surahName: r.surahNameLatin,
    ayahNumber: r.ayahNumber,
    ayahId: `${r.surahNumber}:${r.ayahNumber}`,
    snippet: r.matchSnippet.replace(/<mark>|<\/mark>/g, ""),
    snippetHighlight: r.matchSnippet,
    arabicSnippet:
      r.arabicText.length > ARABIC_SNIPPET_MAX
        ? r.arabicText.slice(0, ARABIC_SNIPPET_MAX) + "…"
        : r.arabicText,
  }));
}
