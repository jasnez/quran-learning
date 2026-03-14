import { describe, it, expect } from "vitest";
import { mergeConsecutiveDuas } from "../mergeConsecutiveDuas";
import type { QuranicDua, DuaCategory } from "@/types/duas";

function makeDua(
  id: string,
  surah: number,
  ayah: number,
  category: DuaCategory = "rabbana"
): QuranicDua {
  return {
    id,
    surahNumber: surah,
    ayahNumber: ayah,
    arabic: `arabic-${id}`,
    transliteration: `trans-${id}`,
    translationBosnian: `bosnian-${id}`,
    category,
  };
}

describe("mergeConsecutiveDuas", () => {
  it("returns empty array for empty input", () => {
    expect(mergeConsecutiveDuas([])).toEqual([]);
  });

  it("returns one item unchanged when single dua", () => {
    const list = [makeDua("3:191", 3, 191)];
    const result = mergeConsecutiveDuas(list);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("3:191");
    expect(result[0].ayahEnd).toBeUndefined();
    expect(result[0].arabic).toBe("arabic-3:191");
  });

  it("merges consecutive verses in same surah into one display dua", () => {
    const list = [
      makeDua("3:191", 3, 191),
      makeDua("3:192", 3, 192),
      makeDua("3:193", 3, 193),
      makeDua("3:194", 3, 194),
    ];
    const result = mergeConsecutiveDuas(list);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("3:191-194");
    expect(result[0].surahNumber).toBe(3);
    expect(result[0].ayahNumber).toBe(191);
    expect(result[0].ayahEnd).toBe(194);
    expect(result[0].arabic).toBe(
      "arabic-3:191 arabic-3:192 arabic-3:193 arabic-3:194"
    );
    expect(result[0].transliteration).toBe(
      "trans-3:191 trans-3:192 trans-3:193 trans-3:194"
    );
    expect(result[0].translationBosnian).toBe(
      "bosnian-3:191 bosnian-3:192 bosnian-3:193 bosnian-3:194"
    );
  });

  it("does not merge non-consecutive verses in same surah", () => {
    const list = [makeDua("3:8", 3, 8), makeDua("3:16", 3, 16)];
    const result = mergeConsecutiveDuas(list);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("3:8");
    expect(result[0].ayahEnd).toBeUndefined();
    expect(result[1].id).toBe("3:16");
    expect(result[1].ayahEnd).toBeUndefined();
  });

  it("does not merge verses from different surahs", () => {
    const list = [makeDua("2:286", 2, 286), makeDua("3:8", 3, 8)];
    const result = mergeConsecutiveDuas(list);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("2:286");
    expect(result[1].id).toBe("3:8");
  });

  it("merges only consecutive runs; gap between runs yields separate groups", () => {
    const list = [
      makeDua("3:191", 3, 191),
      makeDua("3:192", 3, 192),
      makeDua("3:194", 3, 194), // gap: no 3:193
      makeDua("3:195", 3, 195),
    ];
    const result = mergeConsecutiveDuas(list);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("3:191-192");
    expect(result[0].ayahNumber).toBe(191);
    expect(result[0].ayahEnd).toBe(192);
    expect(result[1].id).toBe("3:194-195");
    expect(result[1].ayahNumber).toBe(194);
    expect(result[1].ayahEnd).toBe(195);
  });

  it("sorts by surah then ayah before merging", () => {
    const list = [
      makeDua("3:193", 3, 193),
      makeDua("3:191", 3, 191),
      makeDua("3:192", 3, 192),
      makeDua("3:194", 3, 194),
    ];
    const result = mergeConsecutiveDuas(list);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("3:191-194");
  });
});
