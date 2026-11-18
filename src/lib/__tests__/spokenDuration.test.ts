import { describe, it, expect } from "vitest";
import { spokenDuration, spokenPosition } from "../spokenDuration";

describe("spokenDuration (Bosnian, nominative: '1 minuta', '2 sekunde')", () => {
  it.each([
    [0, "0 sekundi"],
    [1, "1 sekunda"],
    [2, "2 sekunde"],
    [4.9, "4 sekunde"],
    [5, "5 sekundi"],
    [11, "11 sekundi"],
    [12, "12 sekundi"],
    [21, "21 sekunda"],
    [22, "22 sekunde"],
    [60, "1 minuta"],
    [61, "1 minuta i 1 sekunda"],
    [125, "2 minute i 5 sekundi"],
    [11 * 60 + 14, "11 minuta i 14 sekundi"],
    [21 * 60, "21 minuta"],
  ])("%s s -> %s", (seconds, expected) => {
    expect(spokenDuration(seconds)).toBe(expected);
  });

  it("treats a missing or negative time as 0", () => {
    expect(spokenDuration(Number.NaN)).toBe("0 sekundi");
    expect(spokenDuration(-3)).toBe("0 sekundi");
  });
});

describe("spokenPosition ('X od Y', Y in the genitive)", () => {
  it.each([
    [42, 75, "42 sekunde od 1 minute i 15 sekundi"],
    [1, 61, "1 sekunda od 1 minute i 1 sekunde"],
    [0, 3, "0 sekundi od 3 sekunde"],
    [90, 300, "1 minuta i 30 sekundi od 5 minuta"],
  ])("%s of %s -> %s", (position, length, expected) => {
    expect(spokenPosition(position, length)).toBe(expected);
  });
});
