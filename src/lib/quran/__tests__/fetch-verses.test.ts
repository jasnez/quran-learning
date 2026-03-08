import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchVersesByChapter } from "../fetch-verses";

describe("fetchVersesByChapter", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              verses: [
                {
                  id: 1,
                  verse_number: 1,
                  verse_key: "1:1",
                  page_number: 1,
                  juz_number: 1,
                  text_uthmani: "بِسْمِ",
                  translations: [
                    { id: 1, resource_id: 57, text: "Bismi" },
                    { id: 2, resource_id: 126, text: "U ime" },
                  ],
                },
              ],
              pagination: {
                per_page: 50,
                current_page: 1,
                next_page: null,
                total_pages: 1,
                total_records: 1,
              },
            }),
        })
      )
    );
  });

  it("builds URL that includes /api/v4/ so request hits correct endpoint", async () => {
    await fetchVersesByChapter(1);
    expect(fetch).toHaveBeenCalled();
    const callUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(callUrl).toContain("api/v4/verses/by_chapter/1");
    expect(callUrl).not.toMatch(/^https:\/\/api\.quran\.com\/verses\//);
  });

  it("rejects chapterNumber out of range", async () => {
    await expect(fetchVersesByChapter(0)).rejects.toThrow(RangeError);
    await expect(fetchVersesByChapter(115)).rejects.toThrow(RangeError);
  });
});
