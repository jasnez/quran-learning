"use server";

import { searchAyahs } from "@/lib/search/searchAyahs";
import type { SearchResult } from "@/types/quran";

export async function searchAyahsAction(query: string): Promise<SearchResult[]> {
  return searchAyahs(query);
}
