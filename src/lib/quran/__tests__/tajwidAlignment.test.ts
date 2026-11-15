import { describe, it, expect } from "vitest";
import { buildAlignedTajwidSegments } from "../tajwidAlignment";

/**
 * cpfair tajweed annotations index into cpfair's own copy of the Tanzil text,
 * while the app displays Quran.com `text_uthmani`. These tests pin how indices
 * are carried across the differences between the two texts.
 */
describe("buildAlignedTajwidSegments", () => {
  it("colors the annotated characters when base and display text are identical", () => {
    const { segments, unmappedAnnotations } = buildAlignedTajwidSegments("abcdef", "abcdef", [
      { rule: "qalqalah", start: 2, end: 3 },
    ]);
    expect(segments).toEqual([
      { text: "ab", rule: "normal" },
      { text: "c", rule: "qalqalah" },
      { text: "def", rule: "normal" },
    ]);
    expect(unmappedAnnotations).toBe(0);
  });

  it("shifts annotations past characters that exist only in the display text (pause-mark tokens)", () => {
    const { segments } = buildAlignedTajwidSegments("ab cd", "ab \u06DA cd", [
      { rule: "ikhfa", start: 4, end: 5 },
    ]);
    expect(segments).toEqual([
      { text: "ab \u06DA c", rule: "normal" },
      { text: "d", rule: "ikhfa" },
    ]);
  });

  it("skips characters that exist only in the base text, such as the basmala prefix of first ayahs", () => {
    const { segments, unmappedAnnotations } = buildAlignedTajwidSegments("XYZ abc", "abc", [
      { rule: "madd_2", start: 1, end: 2 },
      { rule: "ghunnah", start: 5, end: 6 },
    ]);
    expect(segments).toEqual([
      { text: "a", rule: "normal" },
      { text: "b", rule: "ghunnah" },
      { text: "c", rule: "normal" },
    ]);
    expect(unmappedAnnotations).toBe(1);
  });

  it("colors the tatweel carrier together with the superscript alef it holds (Ar-Rahman in 1:1)", () => {
    // cpfair base text: ٱلرَّحْمَٰنِ (no tatweel); Quran.com: ٱلرَّحْمَـٰنِ (tatweel before the superscript alef)
    const base = "\u0671\u0644\u0631\u0651\u064E\u062D\u0652\u0645\u064E\u0670\u0646\u0650";
    const display = "\u0671\u0644\u0631\u0651\u064E\u062D\u0652\u0645\u064E\u0640\u0670\u0646\u0650";
    const { segments } = buildAlignedTajwidSegments(base, display, [{ rule: "madd_2", start: 9, end: 10 }]);
    expect(segments).toEqual([
      { text: "\u0671\u0644\u0631\u0651\u064E\u062D\u0652\u0645\u064E", rule: "normal" },
      { text: "\u0640\u0670", rule: "mad" },
      { text: "\u0646\u0650", rule: "normal" },
    ]);
  });

  it("maps cpfair rule families onto the four app colors and leaves other rules uncolored", () => {
    const { segments } = buildAlignedTajwidSegments("abcde", "abcde", [
      { rule: "madd_munfasil", start: 0, end: 1 },
      { rule: "idghaam_ghunnah", start: 1, end: 2 },
      { rule: "ikhfa_shafawi", start: 2, end: 3 },
      { rule: "hamzat_wasl", start: 3, end: 4 },
      { rule: "qalqalah", start: 4, end: 5 },
    ]);
    expect(segments).toEqual([
      { text: "a", rule: "mad" },
      { text: "b", rule: "ghunnah" },
      { text: "c", rule: "ikhfa" },
      { text: "d", rule: "normal" },
      { text: "e", rule: "qalqalah" },
    ]);
  });

  it('colors iqlab like ikhfa and shafawi idgham like ghunnah, the nasal sounds they are taught with', () => {
    const { segments } = buildAlignedTajwidSegments('abcd', 'abcd', [
      { rule: 'iqlab', start: 0, end: 1 },
      { rule: 'idghaam_shafawi', start: 2, end: 3 },
      { rule: 'idghaam_no_ghunnah', start: 3, end: 4 },
    ]);
    expect(segments).toEqual([
      { text: 'a', rule: 'ikhfa' },
      { text: 'b', rule: 'normal' },
      { text: 'c', rule: 'ghunnah' },
      { text: 'd', rule: 'normal' },
    ]);
  });

  it("keeps coloring an ayah whose annotations overlap; the later-starting rule wins on shared characters", () => {
    const { segments } = buildAlignedTajwidSegments("abcd", "abcd", [
      { rule: "ikhfa", start: 1, end: 3 },
      { rule: "ghunnah", start: 0, end: 2 },
    ]);
    expect(segments).toEqual([
      { text: "a", rule: "ghunnah" },
      { text: "bc", rule: "ikhfa" },
      { text: "d", rule: "normal" },
    ]);
  });

  it("treats the small yeh (U+06E6) and small high yeh (U+06E7) as the same silah mark", () => {
    // an-nabiyyina (2:61): cpfair text writes the silah ya as U+06E6, Quran.com as U+06E7
    const { segments, unmappedAnnotations } = buildAlignedTajwidSegments("bi\u06E6n", "bi\u06E7n", [
      { rule: "madd_2", start: 2, end: 3 },
    ]);
    expect(segments).toEqual([
      { text: "bi", rule: "normal" },
      { text: "\u06E7", rule: "mad" },
      { text: "n", rule: "normal" },
    ]);
    expect(unmappedAnnotations).toBe(0);
  });

  it("returns one normal segment when there are no annotations", () => {
    expect(buildAlignedTajwidSegments("abc", "abc", []).segments).toEqual([{ text: "abc", rule: "normal" }]);
  });
});
