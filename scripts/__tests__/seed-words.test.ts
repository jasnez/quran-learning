/**
 * Tests for seed-words script: word data structure and seed logic.
 */
import * as path from "path";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { loadWordsJson, runSeedWords } from "../seed-words";

const ROOT = process.cwd();
const WORDS_PATH = path.join(ROOT, "src", "data", "words", "001-al-fatiha.json");

describe("seed-words", () => {
  describe("loadWordsJson", () => {
    it("loads Al-Fatiha words from JSON file", () => {
      const words = loadWordsJson(WORDS_PATH);
      expect(words).toBeDefined();
      expect(Array.isArray(words)).toBe(true);
      expect(words.length).toBeGreaterThan(0);
    });

    it("each word has required fields: ayahNumberGlobal, wordOrder, textArabic, startTimeMs, endTimeMs", () => {
      const words = loadWordsJson(WORDS_PATH);
      for (const w of words) {
        expect(w).toHaveProperty("ayahNumberGlobal");
        expect(w).toHaveProperty("wordOrder");
        expect(w).toHaveProperty("textArabic");
        expect(w).toHaveProperty("startTimeMs");
        expect(w).toHaveProperty("endTimeMs");
        expect(typeof w.startTimeMs).toBe("number");
        expect(typeof w.endTimeMs).toBe("number");
        expect(w.endTimeMs).toBeGreaterThanOrEqual(w.startTimeMs);
      }
    });

    it("Al-Fatiha has words for ayah 1 (Bismillah)", () => {
      const words = loadWordsJson(WORDS_PATH);
      const ayah1Words = words.filter((w) => w.ayahNumberGlobal === 1);
      expect(ayah1Words.length).toBeGreaterThanOrEqual(1);
      expect(ayah1Words.some((w) => w.textArabic.includes("بِسْمِ") || w.textArabic.includes("للَّهِ"))).toBe(true);
    });
  });

  describe("runSeedWords", () => {
    beforeEach(() => {
      vi.resetModules();
    });

    it("upserts words when ayahs exist", async () => {
      const mockFrom = vi.fn((table: string) => {
        if (table === "surahs") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
              }),
            }),
          };
        }
        if (table === "ayahs") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [
                  { id: 10, ayah_number_global: 1 },
                  { id: 11, ayah_number_global: 2 },
                  { id: 12, ayah_number_global: 3 },
                  { id: 13, ayah_number_global: 4 },
                  { id: 14, ayah_number_global: 5 },
                  { id: 15, ayah_number_global: 6 },
                  { id: 16, ayah_number_global: 7 },
                ],
                error: null,
              }),
            }),
          };
        }
        if (table === "words") {
          return {
            upsert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return {};
      });
      const client = { from: mockFrom } as never;
      const stats = await runSeedWords(client, { surahNumber: 1, log: () => {} });
      expect(stats.wordsInserted).toBeGreaterThan(0);
    });
  });
});
