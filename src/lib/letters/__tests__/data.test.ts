import { describe, it, expect } from "vitest";
import { ARABIC_LETTERS, ARABIC_VOWELS, LETTER_RULES_SOURCE } from "../data";
import { consonantSign, transliterateWord } from "@/lib/quran/transliteration";

describe("ARABIC_LETTERS", () => {
  it("lists hamza and the 27 other letters once each", () => {
    expect(ARABIC_LETTERS).toHaveLength(28);
    expect(new Set(ARABIC_LETTERS.map((l) => l.arabic)).size).toBe(28);
    expect(new Set(ARABIC_LETTERS.map((l) => l.name)).size).toBe(28);
  });

  it("has every field filled in", () => {
    for (const letter of ARABIC_LETTERS) {
      for (const value of Object.values(letter)) expect(value.trim().length, letter.arabic).toBeGreaterThan(0);
    }
  });

  it("shows in the app column exactly the sign the transliteration writes", () => {
    const wrong = ARABIC_LETTERS.filter((l) => consonantSign(l.arabic) !== l.special).map((l) => l.arabic);
    expect(wrong).toEqual([]);
  });

  it("tells the systems apart where the rules do", () => {
    const byName = new Map(ARABIC_LETTERS.map((l) => [l.name, l]));
    // General: plain letters; specijal: dž, g, j; DMG: its own signs for the same letters.
    expect(byName.get("Qāf")).toMatchObject({ general: "k", special: "q", dmg: "q" });
    expect(byName.get("Gajn")).toMatchObject({ general: "g", special: "g", dmg: "ġ" });
    expect(byName.get("Jā")).toMatchObject({ general: "j", special: "j", dmg: "y" });
    expect(byName.get("Wāw")).toMatchObject({ general: "v", special: "w", dmg: "w" });
    expect(byName.get("Džīm")).toMatchObject({ general: "dž", special: "dž", dmg: "ğ" });
  });
});

describe("ARABIC_VOWELS", () => {
  it("lists the three short and the three long vowels", () => {
    expect(ARABIC_VOWELS.map((v) => v.name)).toEqual(["Fetha", "Damma", "Kesra", "Dugo a", "Dugo u", "Dugo i"]);
  });

  it("shows the long vowels the way the transliteration writes them", () => {
    const long = ARABIC_VOWELS.slice(3);
    expect(long.map((v) => transliterateWord(v.arabic))).toEqual(long.map((v) => `b${v.special}`));
  });
});

describe("LETTER_RULES_SOURCE", () => {
  it("points to the rules document", () => {
    expect(LETTER_RULES_SOURCE.url).toMatch(/^https:\/\/ilmijja\.ba\/.+\.pdf$/);
  });
});
