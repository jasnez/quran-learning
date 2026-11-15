/**
 * Checks the word-by-word helpers against all static data (6236 verses).
 * Reads files from disk, so it is slower than a unit test.
 */
import { describe, it, expect, beforeAll } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import type { Ayah } from "@/types/quran";
import type { VerseTimestamp } from "@/types/wordByWord";
import { splitTajwidIntoWords } from "../splitTajwidIntoWords";
import { buildAyahWordTimeline } from "../wbwTiming";

const ROOT = process.cwd();
const AYAHS_DIR = path.join(ROOT, "src", "data", "ayahs");
const WORDS_DIR = path.join(ROOT, "public", "data", "words");
const AUDIO_DIR = path.join(ROOT, "public", "data", "chapter-audio");

type VerseRow = { key: string; ayah: Ayah; wordJsonCount: number; verse: VerseTimestamp | undefined };
let rows: VerseRow[] = [];

beforeAll(() => {
  rows = [];
  for (const file of fs.readdirSync(AYAHS_DIR).filter((f) => f.endsWith(".json"))) {
    const surahNumber = parseInt(file.slice(0, 3), 10);
    const ayahs = (JSON.parse(fs.readFileSync(path.join(AYAHS_DIR, file), "utf8")) as { ayahs: Ayah[] }).ayahs;
    const words = JSON.parse(fs.readFileSync(path.join(WORDS_DIR, file), "utf8")) as { ayahNumberGlobal: number }[];
    const audio = JSON.parse(fs.readFileSync(path.join(AUDIO_DIR, file), "utf8")) as { timestamps: VerseTimestamp[] };
    const countByGlobal = new Map<number, number>();
    for (const w of words) countByGlobal.set(w.ayahNumberGlobal, (countByGlobal.get(w.ayahNumberGlobal) ?? 0) + 1);
    const verseByKey = new Map(audio.timestamps.map((t) => [t.verseKey, t]));
    for (const ayah of ayahs) {
      const key = `${surahNumber}:${ayah.ayahNumber}`;
      rows.push({ key, ayah, wordJsonCount: countByGlobal.get(ayah.ayahNumberGlobal) ?? 0, verse: verseByKey.get(key) });
    }
  }
});

function timelineFor(key: string) {
  const row = rows.find((r) => r.key === key)!;
  return buildAyahWordTimeline(row.verse!, splitTajwidIntoWords(row.ayah.tajwidSegments, key).length);
}

describe("word-by-word data (all surahs)", () => {
  it("covers all 6236 verses with chapter timestamps", () => {
    expect(rows).toHaveLength(6236);
    expect(rows.filter((r) => !r.verse)).toEqual([]);
  });

  it("word count matches Quran.com word data for all 6236 verses", () => {
    const mismatches = rows
      .filter((r) => splitTajwidIntoWords(r.ayah.tajwidSegments, r.key).length !== r.wordJsonCount)
      .map((r) => r.key);
    expect(mismatches).toEqual([]);
  });

  it("timeline is available for 1:1, 2:14, 36:9, 6:93 and disabled for 5:20, 7:159", () => {
    for (const key of ["1:1", "2:14", "36:9", "6:93"]) expect(timelineFor(key), key).not.toBeNull();
    for (const key of ["5:20", "7:159"]) expect(timelineFor(key), key).toBeNull();
  });

  it("no enabled timeline starts two words at 0 ms", () => {
    const bad = rows
      .filter((r) => {
        const t = buildAyahWordTimeline(r.verse!, splitTajwidIntoWords(r.ayah.tajwidSegments, r.key).length);
        return t != null && t.filter((e) => e.startMs === 0).length > 1;
      })
      .map((r) => r.key);
    expect(bad).toEqual([]);
  });

  // 147 measured on 2026-11-15 (2.4%) with the final validity rules; a regenerated data set that
  // disables more verses must be looked at.
  it("disabled verses do not exceed the measured 147", () => {
    const disabled = rows.filter(
      (r) => buildAyahWordTimeline(r.verse!, splitTajwidIntoWords(r.ayah.tajwidSegments, r.key).length) === null,
    );
    console.info(`word-by-word disabled for ${disabled.length} of ${rows.length} verses`);
    expect(disabled.length).toBeLessThanOrEqual(147);
  });
});
