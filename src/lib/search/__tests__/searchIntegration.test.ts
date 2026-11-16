/**
 * Integration tests for the search the app uses: searchClient against the real
 * public/data/search-index.json (no mocked index). Only fetch is replaced, so the
 * file is read from disk instead of the network.
 * @vitest-environment node
 */
import * as fs from "fs";
import * as path from "path";
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { searchAyahs, __resetSearchIndexCacheForTests } from "../searchClient";

const INDEX_PATH = path.join(process.cwd(), "public", "data", "search-index.json");

describe("search (integration, real index)", () => {
  beforeAll(() => {
    const body = fs.readFileSync(INDEX_PATH, "utf-8");
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url !== "/data/search-index.json") throw new Error(`Unexpected fetch: ${url}`);
        return new Response(body, { status: 200, headers: { "Content-Type": "application/json" } });
      }),
    );
    __resetSearchIndexCacheForTests();
  });

  afterAll(() => {
    vi.unstubAllGlobals();
    __resetSearchIndexCacheForTests();
  });

  it("index covers all 114 surahs and 6236 ayahs", () => {
    const index = JSON.parse(fs.readFileSync(INDEX_PATH, "utf-8")) as { ayahs: unknown[] }[];
    expect(index).toHaveLength(114);
    expect(index.reduce((sum, s) => sum + s.ayahs.length, 0)).toBe(6236);
  });

  it("empty query returns []", async () => {
    expect(await searchAyahs("")).toEqual([]);
    expect(await searchAyahs("   ")).toEqual([]);
    expect(await searchAyahs("\t\n")).toEqual([]);
  });

  it("query 'Milostivog' finds the translation and highlights it", async () => {
    const results = await searchAyahs("Milostivog");
    expect(results.length).toBeGreaterThanOrEqual(1);
    results.forEach((r) => {
      expect(r.snippetHighlight).toContain("<mark>");
      expect(r.snippetHighlight.toLowerCase()).toContain("milostivog");
    });
  });

  it("is case-insensitive", async () => {
    const lower = await searchAyahs("rahman");
    const upper = await searchAyahs("Rahman");
    expect(lower.length).toBeGreaterThanOrEqual(1);
    expect(lower.map((r) => r.ayahId)).toEqual(upper.map((r) => r.ayahId));
  });

  it("Arabic query without tashkeel finds the Uthmani text", async () => {
    const results = await searchAyahs("الرحمن");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.map((r) => r.ayahId)).toContain("1:3");
  });

  it("ayah reference '2:255' returns that ayah first", async () => {
    const results = await searchAyahs("2:255");
    expect(results[0].ayahId).toBe("2:255");
  });

  it("returns at most 50 results", async () => {
    const results = await searchAyahs("a");
    expect(results.length).toBeLessThanOrEqual(50);
  });

  it("each result has a valid SearchResult shape", async () => {
    const results = await searchAyahs("ime");
    expect(results.length).toBeGreaterThanOrEqual(1);
    results.forEach((r) => {
      const surah = Number(r.surahId);
      expect(surah).toBeGreaterThanOrEqual(1);
      expect(surah).toBeLessThanOrEqual(114);
      expect(r.ayahNumber).toBeGreaterThanOrEqual(1);
      expect(r.ayahId).toBe(`${r.surahId}:${r.ayahNumber}`);
      expect(r.surahName).toBeTruthy();
      expect(typeof r.snippet).toBe("string");
      expect(r.arabicSnippet).toBeTruthy();
    });
  });

  it.each([
    ["fatiha", "1:1"],
    ["Fātiḥa", "1:1"],
    ["bekara", "2:1"],
    ["beqare", "2:1"],
    ["baqarah", "2:1"],
    ["El Beqare", "2:1"],
    ["Ma'ida", "5:1"],
    ["ali imran", "3:1"],
    ["Jasin", "36:1"],
    ["ikhlas", "112:1"],
  ])("surah name query %s puts %s first", async (query, ayahId) => {
    const results = await searchAyahs(query);
    expect(results[0].ayahId).toBe(ayahId);
  });

  it("names the surah of a result with its main (specijal) name", async () => {
    const results = await searchAyahs("2:255");
    expect(results[0].surahName).toBe("El-Beqare");
  });
});
