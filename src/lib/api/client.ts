import type { SurahSummary, SurahDetail, SearchResult, Reciter } from "@/types/quran";
import { getBaseUrl } from "./getBaseUrl";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const base = getBaseUrl();
  const url = base + path;
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

export type SurahsResponse = { surahs: SurahSummary[] };
export type SurahDetailResponse = SurahDetail;
export type SearchResponse = { results: SearchResult[]; total: number };
export type RecitersResponse = { reciters: Reciter[] };

/**
 * Fetch all surahs (all 114).
 */
export async function fetchSurahs(): Promise<SurahSummary[]> {
  const data = await apiFetch<SurahsResponse>("/api/surahs");
  return data.surahs;
}

/**
 * Fetch surah detail with all ayahs (translations, transliterations, tajwid, audio).
 */
export async function fetchSurahDetail(surahNumber: number): Promise<SurahDetail> {
  const data = await apiFetch<SurahDetailResponse>(`/api/surahs/${surahNumber}`);
  return data;
}

/**
 * Full-text search across ayahs, translations, transliterations (PostgreSQL ILIKE).
 */
export async function searchAyahs(query: string): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const data = await apiFetch<SearchResponse>(
    "/api/search?q=" + encodeURIComponent(trimmed)
  );
  return data.results;
}

/**
 * Fetch all active reciters.
 */
export async function fetchReciters(): Promise<Reciter[]> {
  const data = await apiFetch<RecitersResponse>("/api/reciters");
  return data.reciters;
}
