import { describe, it, expect } from "vitest";
import { formatLongestStreak } from "../formatProfileStats";

describe("formatLongestStreak", () => {
  it("returns '0 dana' for 0", () => {
    expect(formatLongestStreak(0)).toBe("0 dana");
  });

  it("returns '1 dan' for 1", () => {
    expect(formatLongestStreak(1)).toBe("1 dan");
  });

  it("returns '2 dana' for 2", () => {
    expect(formatLongestStreak(2)).toBe("2 dana");
  });

  it("returns 'X dana' for 5 and more", () => {
    expect(formatLongestStreak(5)).toBe("5 dana");
    expect(formatLongestStreak(10)).toBe("10 dana");
  });

  it("handles negative as 0", () => {
    expect(formatLongestStreak(-1)).toBe("0 dana");
  });

  it("handles non-finite as 0", () => {
    expect(formatLongestStreak(Number.NaN)).toBe("0 dana");
    expect(formatLongestStreak(Number.POSITIVE_INFINITY)).toBe("0 dana");
  });
});
