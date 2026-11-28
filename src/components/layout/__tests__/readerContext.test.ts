/**
 * readerContext: what the global header shows on a reading screen, from the route segment and
 * its parameter. Null means the brand header (every other route, and anything that is not a real
 * surah or juz number: the static 404.html is served for unknown URLs).
 */
import { describe, it, expect } from "vitest";
import surahsData from "@/data/surahs.json";
import type { SurahSummary } from "@/types/quran";
import { readerContext } from "../readerContext";

const surahs = surahsData as SurahSummary[];
const ihlas = surahs.find((s) => s.surahNumber === 112)!;
const beqare = surahs.find((s) => s.surahNumber === 2)!;

describe("readerContext", () => {
  it("names the surah on a surah page, with its ayah count and the way back to all surahs", () => {
    expect(readerContext("surah", { surahId: "112" })).toEqual({
      kind: "surah",
      title: ihlas.nameLatin,
      titleArabic: ihlas.nameArabic,
      backHref: "/surahs",
      backLabel: "Nazad na sve sure",
      total: 4,
    });
  });

  it("knows the longest surah's count", () => {
    expect(readerContext("surah", { surahId: "2" })).toMatchObject({ title: beqare.nameLatin, total: 286 });
  });

  it("names the juz on a juz page, with the way back to the juz list and no count", () => {
    expect(readerContext("juz", { juzId: "30" })).toEqual({
      kind: "juz",
      title: "Džuz 30",
      backHref: "/surahs?view=juz",
      backLabel: "Nazad na sve džuzeve",
    });
  });

  it("on the learning screen names the surah and leads back to its reader", () => {
    expect(readerContext("learn", { surahId: "36" })).toMatchObject({
      kind: "learn",
      total: 83,
      backHref: "/surah/36",
      backLabel: "Nazad na suru",
    });
  });

  it.each([
    ["surah", { surahId: "115" }],
    ["surah", { surahId: "0" }],
    ["surah", { surahId: "abc" }],
    ["surah", { surahId: "1.5" }],
    ["surah", {}],
    ["juz", { juzId: "31" }],
    ["juz", { juzId: "0" }],
    ["learn", {}],
    ["learn", { surahId: "115" }],
    ["surahs", {}],
    ["/_not-found", { surahId: "1" }],
    [null, {}],
  ] as const)("is null for segment %s with %o", (segment, params) => {
    expect(readerContext(segment, params)).toBeNull();
  });

  it("takes the first value of a repeated parameter", () => {
    expect(readerContext("surah", { surahId: ["112", "1"] })).toMatchObject({ total: 4 });
  });

  it("is null without parameters at all", () => {
    expect(readerContext("surah", null)).toBeNull();
  });
});
