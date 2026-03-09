/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "../route";

vi.mock("@/lib/supabase/surahs-data", () => ({
  fetchWordsFromDb: vi.fn(),
}));

const { fetchWordsFromDb } = await import("@/lib/supabase/surahs-data");

describe("GET /api/surahs/[surahNumber]/words", () => {
  beforeEach(() => {
    vi.mocked(fetchWordsFromDb).mockReset();
  });

  it("returns 404 for invalid surah number (0)", async () => {
    const res = await GET(new Request("http://localhost/api/surahs/0/words"), {
      params: Promise.resolve({ surahNumber: "0" }),
    });
    expect(res.status).toBe(404);
  });

  it("returns 404 for invalid surah number (115)", async () => {
    const res = await GET(new Request("http://localhost/api/surahs/115/words"), {
      params: Promise.resolve({ surahNumber: "115" }),
    });
    expect(res.status).toBe(404);
  });

  it("returns 404 for non-numeric surah number", async () => {
    const res = await GET(new Request("http://localhost/api/surahs/abc/words"), {
      params: Promise.resolve({ surahNumber: "abc" }),
    });
    expect(res.status).toBe(404);
  });

  it("returns word-level data for valid surah (Al-Fatiha)", async () => {
    const mockWords = [
      {
        id: 1,
        ayahId: 1,
        wordOrder: 1,
        textArabic: "بِسْمِ",
        transliteration: "Bismi",
        translationShort: "In the name of",
        startTimeMs: 0,
        endTimeMs: 500,
        tajwidRule: "normal" as const,
      },
    ];
    vi.mocked(fetchWordsFromDb).mockResolvedValue(mockWords);

    const res = await GET(new Request("http://localhost/api/surahs/1/words"), {
      params: Promise.resolve({ surahNumber: "1" }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(mockWords);
    expect(fetchWordsFromDb).toHaveBeenCalledWith(1);
  });

  it("returns empty array when surah has no word data", async () => {
    vi.mocked(fetchWordsFromDb).mockResolvedValue([]);

    const res = await GET(new Request("http://localhost/api/surahs/2/words"), {
      params: Promise.resolve({ surahNumber: "2" }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual([]);
  });

  it("sets Cache-Control header for caching", async () => {
    vi.mocked(fetchWordsFromDb).mockResolvedValue([]);

    const res = await GET(new Request("http://localhost/api/surahs/1/words"), {
      params: Promise.resolve({ surahNumber: "1" }),
    });
    expect(res.headers.get("Cache-Control")).toMatch(/max-age=\d+/);
  });
});
