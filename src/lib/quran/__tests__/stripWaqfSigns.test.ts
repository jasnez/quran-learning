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

  it("removes multiple waqf signs in range U+06D6–U+06ED", () => {
    const withSigns = "ا\u06D6ب\u06D7ت\u06EDث";
    expect(stripWaqfSigns(withSigns)).toBe("ابتث");
  });

  it("leaves normal Arabic letters and harakat unchanged", () => {
    const normal = "الرَّحْمَـٰنِ";
    expect(stripWaqfSigns(normal)).toBe(normal);
  });
});
