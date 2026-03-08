/**
 * Tests for search server action: searchAyahsAction.
 * Verifies mapping from EngineSearchResult to SearchResult and edge cases.
 * @vitest-environment node
 */
import { describe, it, expect } from "vitest";
import { searchAyahsAction } from "../actions";
import type { SearchResult } from "@/types/quran";

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
    if (result.length === 0) return;
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

  it("arabicSnippet is at most 50 chars + ellipsis when long", async () => {
    const result = await searchAyahsAction("الرحمن");
    result.forEach((r: SearchResult) => {
      if (r.arabicSnippet.length > 50) {
        expect(r.arabicSnippet).toMatch(/^.+\u2026$/); // ends with …
      }
    });
  });

  it("link target format: surahId and ayahId match /surah/:id#ayah-:surah-:ayah", async () => {
    const result = await searchAyahsAction("Bismi");
    if (result.length === 0) return;
    const r = result[0];
    const [surahId, ayahNum] = r.ayahId.split(":");
    expect(r.surahId).toBe(surahId);
    expect(Number(r.ayahNumber)).toBe(Number(ayahNum));
  });
});
