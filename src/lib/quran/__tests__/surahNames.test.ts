import { describe, it, expect } from "vitest";
import { commonSurahName, surahNameWithCommon } from "../surahNames";

describe("commonSurahName", () => {
  it("returns the common form when it differs from the main name", () => {
    expect(commonSurahName({ nameLatin: "El-Beqare", nameBosnian: "Bekara" })).toBe("Bekara");
  });

  it("returns null when the Pravila give a single form", () => {
    expect(commonSurahName({ nameLatin: "Merjem", nameBosnian: "Merjem" })).toBeNull();
  });

  it("returns null for an empty common form", () => {
    expect(commonSurahName({ nameLatin: "El-Beqare", nameBosnian: " " })).toBeNull();
  });
});

describe("surahNameWithCommon", () => {
  it("adds the common form in parentheses", () => {
    expect(surahNameWithCommon({ nameLatin: "El-Beqare", nameBosnian: "Bekara" })).toBe("El-Beqare (Bekara)");
  });

  it("shows a single form once", () => {
    expect(surahNameWithCommon({ nameLatin: "Merjem", nameBosnian: "Merjem" })).toBe("Merjem");
  });
});
