import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchVerseContentByKey } from "../fetch-verse-by-key";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("fetchVerseContentByKey", () => {
  it("returns arabic, transliteration, translationBosnian for verse 2:201", async () => {
    const mockVerse = {
      verse: {
        verse_key: "2:201",
        text_uthmani: "وَمِنْهُم مَّن يَقُولُ رَبَّنَآ ءَاتِنَا...",
        translations: [
          { resource_id: 57, text: "Waminhum man yaqoolu rabbana atina..." },
          {
            resource_id: 126,
            text: "A ima i onih koji govore: \"Gospodaru naš, podaj nam dobro...\"",
          },
        ],
      },
    };

    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockVerse),
        } as Response)
      )
    );

    const result = await fetchVerseContentByKey("2:201");

    expect(result.arabic).toBe(mockVerse.verse.text_uthmani);
    expect(result.transliteration).toContain("rabbana");
    expect(result.translationBosnian).toContain("Gospodaru naš");
    expect(result.translationBosnian).toBe(
      mockVerse.verse.translations!.find((t) => t.resource_id === 126)!.text
    );
  });

  it("strips HTML from translation text", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              verse: {
                verse_key: "1:1",
                text_uthmani: "بِسْمِ",
                translations: [
                  { resource_id: 57, text: "Bismi" },
                  { resource_id: 126, text: "U ime <em>Allaha</em>!" },
                ],
              },
            }),
        } as Response)
      )
    );

    const result = await fetchVerseContentByKey("1:1");
    expect(result.translationBosnian).toBe("U ime Allaha!");
  });

  it("throws on API error response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({ ok: false, status: 404, statusText: "Not Found" } as Response)
      )
    );

    await expect(fetchVerseContentByKey("999:1")).rejects.toThrow(/Quran API error/);
  });
});
