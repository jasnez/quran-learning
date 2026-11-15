import { describe, it, expect } from "vitest";
import { stripWaqfSigns } from "../stripWaqfSigns";

describe("stripWaqfSigns", () => {
  it("returns empty string unchanged", () => {
    expect(stripWaqfSigns("")).toBe("");
  });

  it("returns text without waqf symbols unchanged", () => {
    const text = "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ";
    expect(stripWaqfSigns(text)).toBe(text);
  });

  it("removes U+06D6 (Arabic small high sign)", () => {
    const withSign = "وَلَكُن\u06D6";
    expect(stripWaqfSigns(withSign)).toBe("وَلَكُن");
  });

  it("removes all pause signs U+06D6-U+06DC", () => {
    const withSigns = "اۖبۗتۘثۙجۚحۛخۜد";
    expect(stripWaqfSigns(withSigns)).toBe("ابتثجحخد");
  });

  it("removes the rub el hizb and sajdah symbols", () => {
    expect(stripWaqfSigns("۞ ا")).toBe(" ا");
    expect(stripWaqfSigns("ا ۩")).toBe("ا ");
  });

  // These are part of the Uthmani spelling (silent letters, iqlab, long vowels, imala...),
  // not pause signs: hiding them changes how the word is read.
  it.each([
    ["U+06DF small high rounded zero (2:5)", "أُو۟لَـٰٓئِكَ"],
    ["U+06E0 small high upright rectangular zero (2:258)", "أَنَا۠"],
    ["U+06E2 small high meem, iqlab (2:10)", "أَلِيمٌۢ"],
    ["U+06E3 small low seen (52:37)", "ٱلْمُصَۣيْطِرُونَ"],
    ["U+06E5 small waw (2:17)", "حَوْلَهُۥ"],
    ["U+06E6 small yeh (2:22)", "بِهِۦ"],
    ["U+06E7 small high yeh (2:61)", "ٱلنَّبِيِّـۧنَ"],
    ["U+06E8 small high noon (21:88)", "نُـۨجِى"],
    ["U+06EA imala (11:41)", "مَجْر۪ىٰهَا"],
    ["U+06EB ishmam (12:11)", "تَأْمَ۫نَّا"],
    ["U+06EC tas-hil (41:44)", "ءَا۬عْجَمِىٌّ"],
    ["U+06ED small low meem (2:41)", "كَافِرٍۭ"],
  ])("keeps %s", (_name, word) => {
    expect(stripWaqfSigns(word)).toBe(word);
  });

  it("leaves normal Arabic letters and harakat unchanged", () => {
    const normal = "الرَّحْمَـٰنِ";
    expect(stripWaqfSigns(normal)).toBe(normal);
  });
});
