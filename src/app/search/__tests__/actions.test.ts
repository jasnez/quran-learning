/**
 * Tests for search server action: searchAyahsAction.
 * Mocks API client so tests don't require a running server.
 * @vitest-environment node
 */
import { describe, it, expect, vi } from "vitest";
import { searchAyahsAction } from "../actions";
import type { SearchResult } from "@/types/quran";

const mockResults: SearchResult[] = [
  {
    surahId: "1",
    surahName: "Al-Fatiha",
    ayahNumber: 1,
    ayahId: "1:1",
    snippet: "U ime Allaha, Milostivog, Samilosnog!",
    snippetHighlight: "U ime Allaha, <mark>Milostivog</mark>, Samilosnog!",
    arabicSnippet: "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ",
  },
];

vi.mock("@/lib/api/client", () => ({
  searchAyahs: vi.fn((query: string) => {
    const q = query.trim();
    if (!q) return Promise.resolve([]);
    if (q === "Milostivog" || q === "Allaha" || q === "Bismi") return Promise.resolve(mockResults);
    if (q === "الرحمن") return Promise.resolve([{ ...mockResults[0], arabicSnippet: "ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ".slice(0, 50) + "…" }]);
    return Promise.resolve([]);
  }),
}));

describe("searchAyahsAction", () => {
  it("returns empty array for empty string", async () => {
    const result = await searchAyahsAction("");
    expect(result).toEqual([]);
  });

  it("returns empty array for whitespace-only query", async () => {
    const result = await searchAyahsAction("   \n\t ");
    expect(result).toEqual([]);
  });

  it("returns SearchResult shape for each item", async () => {
    const result = await searchAyahsAction("Milostivog");
    expect(result.length).toBeGreaterThan(0);
    result.forEach((r: SearchResult) => {
      expect(r).toHaveProperty("surahId");
      expect(r).toHaveProperty("surahName");
      expect(r).toHaveProperty("ayahNumber");
      expect(r).toHaveProperty("ayahId");
      expect(r).toHaveProperty("snippet");
      expect(r).toHaveProperty("snippetHighlight");
      expect(r).toHaveProperty("arabicSnippet");
      expect(typeof r.surahId).toBe("string");
      expect(typeof r.surahName).toBe("string");
      expect(typeof r.ayahNumber).toBe("number");
      expect(r.ayahId).toMatch(/^\d+:\d+$/);
      expect(typeof r.snippet).toBe("string");
      expect(typeof r.snippetHighlight).toBe("string");
      expect(typeof r.arabicSnippet).toBe("string");
    });
  });

  it("snippet is plain text (no <mark>), snippetHighlight contains <mark>", async () => {
    const result = await searchAyahsAction("Allaha");
    if (result.length === 0) return;
    const r = result[0];
    expect(r.snippet).not.toContain("<mark>");
    expect(r.snippet).not.toContain("</mark>");
    expect(r.snippetHighlight).toContain("<mark>");
    expect(r.snippetHighlight).toContain("</mark>");
  });

  it("arabicSnippet can end with ellipsis when long", async () => {
    const result = await searchAyahsAction("الرحمن");
    result.forEach((r: SearchResult) => {
      if (r.arabicSnippet.length > 50) {
        expect(r.arabicSnippet).toMatch(/.+\u2026$/);
      }
    });
  });

  it("link target format: surahId and ayahId match", async () => {
    const result = await searchAyahsAction("Bismi");
    if (result.length === 0) return;
    const r = result[0];
    const [surahId, ayahNum] = r.ayahId.split(":");
    expect(r.surahId).toBe(surahId);
    expect(Number(r.ayahNumber)).toBe(Number(ayahNum));
  });
});
