import { describe, it, expect, vi } from "vitest";
import * as path from "path";
import {
  loadSurahs,
  loadReciters,
  getAyahFilePath,
  loadAyahFile,
  runSeed,
} from "../seed-database";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "src", "data");

describe("seed-database", () => {
  describe("loadSurahs", () => {
    it("loads 114 surahs from src/data/surahs.json", () => {
      const surahs = loadSurahs(path.join(DATA_DIR, "surahs.json"));
      expect(surahs).toHaveLength(114);
    });
    it("first surah has surahNumber 1 and slug al-fatiha", () => {
      const surahs = loadSurahs(path.join(DATA_DIR, "surahs.json"));
      expect(surahs[0].surahNumber).toBe(1);
      expect(surahs[0].slug).toBe("al-fatiha");
    });
  });

  describe("loadReciters", () => {
    it("loads reciters from src/data/reciters.json", () => {
      const reciters = loadReciters(path.join(DATA_DIR, "reciters.json"));
      expect(reciters.length).toBeGreaterThanOrEqual(1);
    });
    it("includes mishary-alafasy", () => {
      const reciters = loadReciters(path.join(DATA_DIR, "reciters.json"));
      const found = reciters.find((r) => r.id === "mishary-alafasy");
      expect(found).toBeDefined();
      expect(found?.name).toBe("Mishary Alafasy");
    });
  });

  describe("getAyahFilePath", () => {
    it("returns path with zero-padded number and slug", () => {
      const p = getAyahFilePath(1, "al-fatiha");
      expect(p).toContain("ayahs");
      expect(p).toMatch(/001-al-fatiha\.json$/);
    });
  });

  describe("loadAyahFile", () => {
    it("loads surah and ayahs from 001-al-fatiha.json", () => {
      const filePath = path.join(DATA_DIR, "ayahs", "001-al-fatiha.json");
      const payload = loadAyahFile(filePath);
      expect(payload.surah.surahNumber).toBe(1);
      expect(payload.surah.slug).toBe("al-fatiha");
      expect(payload.ayahs).toHaveLength(7);
    });
    it("first ayah has arabicText and translationBosnian", () => {
      const filePath = path.join(DATA_DIR, "ayahs", "001-al-fatiha.json");
      const { ayahs } = loadAyahFile(filePath);
      expect(ayahs[0].ayahNumber).toBe(1);
      expect(ayahs[0].ayahNumberGlobal).toBe(1);
      expect(ayahs[0].arabicText).toBeTruthy();
      expect(ayahs[0].translationBosnian).toBeTruthy();
      expect(ayahs[0].transliteration).toBeTruthy();
      expect(ayahs[0].tajwidSegments).toBeDefined();
      expect(ayahs[0].audio).toBeDefined();
    });
    it("throws on invalid file shape", () => {
      expect(() =>
        loadAyahFile(path.join(DATA_DIR, "surahs.json"))
      ).toThrow(/Invalid ayah file shape/);
    });
  });

  describe("runSeed", () => {
    it("is idempotent: uses upsert and logs progress", async () => {
      const log = vi.fn();
      const selectReturn: Record<string, unknown[]> = {
        surahs: Array.from({ length: 114 }, (_, i) => ({
          id: i + 1,
          surah_number: i + 1,
        })),
        ayahs: Array.from({ length: 7 }, (_, i) => ({
          id: 100 + i,
          ayah_number_global: i + 1,
        })),
      };

      const mockFrom = vi.fn((table: string) => ({
        upsert: vi.fn(() => ({
          select: vi.fn(() =>
            Promise.resolve({
              data: selectReturn[table] ?? [],
              error: null,
            })
          ),
        })),
      }));

      const client = {
        from: mockFrom,
      } as unknown as import("@supabase/supabase-js").SupabaseClient;

      const stats = await runSeed(client, {
        dataDir: DATA_DIR,
        log,
      });

      expect(log).toHaveBeenCalledWith(
        expect.stringContaining("114 surahs")
      );
      expect(log).toHaveBeenCalledWith(
        expect.stringMatching(/Seeding surah 1\/114/)
      );
      expect(log).toHaveBeenCalledWith(
        expect.stringMatching(/Done: \d+ ayahs inserted/)
      );

      expect(stats.recitersInserted).toBeGreaterThanOrEqual(1);
      expect(stats.surahsInserted).toBe(114);
      expect(stats.ayahsInserted).toBeGreaterThanOrEqual(7);
      expect(stats.translationsInserted).toBeGreaterThanOrEqual(7);
      expect(stats.transliterationsInserted).toBeGreaterThanOrEqual(7);
      expect(stats.tajwidInserted).toBeGreaterThanOrEqual(7);
      expect(stats.audioTracksInserted).toBeGreaterThanOrEqual(7);

      expect(mockFrom).toHaveBeenCalledWith("reciters");
      expect(mockFrom).toHaveBeenCalledWith("surahs");
      expect(mockFrom).toHaveBeenCalledWith("ayahs");
      expect(mockFrom).toHaveBeenCalledWith("translations");
      expect(mockFrom).toHaveBeenCalledWith("transliterations");
      expect(mockFrom).toHaveBeenCalledWith("tajwid_markup");
      expect(mockFrom).toHaveBeenCalledWith("audio_tracks");
    });
  });
});
