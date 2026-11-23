import { describe, it, expect } from "vitest";
import { contrastRatio, relativeLuminance } from "../contrast";

describe("contrastRatio", () => {
  it("is 21 for black on white and 1 for a color on itself", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
    expect(contrastRatio("#1F3A5F", "#1F3A5F")).toBe(1);
  });

  it("matches the handoff's measurement for ink on paper (15.6:1)", () => {
    expect(contrastRatio("#1E1B16", "#F7F4ED")).toBeCloseTo(15.6, 1);
  });

  it("is symmetric and accepts lower-case hex", () => {
    expect(contrastRatio("#f7f4ed", "#1e1b16")).toBe(contrastRatio("#1E1B16", "#F7F4ED"));
  });

  it("rejects anything but #RRGGBB", () => {
    expect(() => contrastRatio("red", "#FFFFFF")).toThrow(/#RRGGBB/);
    expect(() => relativeLuminance("#FFF")).toThrow(/#RRGGBB/);
  });
});
