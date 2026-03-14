import { describe, it, expect } from "vitest";
import { getAyahIdsFromDua } from "../getAyahIdsFromDua";
import type { DisplayDua } from "@/types/duas";

function makeDua(surahNumber: number, ayahNumber: number, ayahEnd?: number): DisplayDua {
  return {
    id: ayahEnd != null ? `${surahNumber}:${ayahNumber}-${ayahEnd}` : `${surahNumber}:${ayahNumber}`,
    surahNumber,
    ayahNumber,
    ayahEnd,
    arabic: "",
    transliteration: "",
    translationBosnian: "",
    category: "rabbana",
  };
}

describe("getAyahIdsFromDua", () => {
  it("returns single ayah id for single-verse dua", () => {
    expect(getAyahIdsFromDua(makeDua(3, 192))).toEqual(["3:192"]);
    expect(getAyahIdsFromDua(makeDua(2, 201))).toEqual(["2:201"]);
  });

  it("returns range of ayah ids for merged dua (ayahEnd)", () => {
    expect(getAyahIdsFromDua(makeDua(3, 191, 194))).toEqual(["3:191", "3:192", "3:193", "3:194"]);
  });

  it("returns single id when ayahNumber equals ayahEnd", () => {
    expect(getAyahIdsFromDua(makeDua(7, 23, 23))).toEqual(["7:23"]);
  });
});
