import { afterEach, describe, expect, it, vi } from "vitest";
import { AYAH_FORMS, SURAH_FORMS, formatCount, formatNumber, formatTimeAgo, relativePhrase } from "../format";

describe("formatNumber", () => {
  it("groups thousands with a dot and uses a decimal comma", () => {
    expect(formatNumber(6236)).toBe("6.236");
    expect(formatNumber(0.75)).toBe("0,75");
    expect(formatNumber(1.25)).toBe("1,25");
    expect(formatNumber(114)).toBe("114");
  });
});

describe("formatCount", () => {
  it.each([
    [0, "0 ajeta"],
    [1, "1 ajet"],
    [2, "2 ajeta"],
    [5, "5 ajeta"],
    [11, "11 ajeta"],
    [21, "21 ajet"],
    [22, "22 ajeta"],
    [31, "31 ajet"],
    [111, "111 ajeta"],
    [1234, "1.234 ajeta"],
  ])("%i ayahs -> %s", (n, expected) => expect(formatCount(n, AYAH_FORMS)).toBe(expected));
  it.each([
    [1, "1 sura"],
    [2, "2 sure"],
    [5, "5 sura"],
    [21, "21 sura"],
    [114, "114 sura"],
  ])("%i surahs -> %s", (n, expected) => expect(formatCount(n, SURAH_FORMS)).toBe(expected));
});

describe("Croatian fallback (D1)", () => {
  it("has the same plural categories and number format as Bosnian", () => {
    const bs = new Intl.PluralRules("bs");
    const hr = new Intl.PluralRules("hr");
    for (let n = 0; n <= 1000; n++) expect(hr.select(n)).toBe(bs.select(n));
    expect(new Intl.NumberFormat("hr").format(6236.75)).toBe(new Intl.NumberFormat("bs").format(6236.75));
  });
});

describe("formatTimeAgo", () => {
  const now = Date.parse("2026-11-19T12:00:00Z");
  const MIN = 60_000;
  const HOUR = 60 * MIN;
  const DAY = 24 * HOUR;
  const ago = (ms: number) => new Date(now - ms).toISOString();
  it.each([
    [0, "sada"],
    [59_000, "sada"],
    [MIN, "prije 1 minutu"],
    [2 * MIN, "prije 2 minute"],
    [5 * MIN, "prije 5 minuta"],
    [HOUR, "prije 1 sat"],
    [2 * HOUR, "prije 2 sata"],
    [5 * HOUR, "prije 5 sati"],
    [DAY, "jučer"],
    [2 * DAY, "prekjučer"],
    [3 * DAY, "prije 3 dana"],
    [7 * DAY, "prošle sedmice"],
    [14 * DAY, "prije 2 sedmice"],
    [30 * DAY, "prošli mjesec"],
    [60 * DAY, "prije 2 mjeseca"],
    [365 * DAY, "prošle godine"],
    [730 * DAY, "prije 2 godine"],
  ])("%i ms ago -> %s", (ms, expected) => expect(formatTimeAgo(ago(ms), now)).toBe(expected));
  // Just below and at each threshold (D2): the unit changes only when the next one is reached.
  it.each([
    [59 * MIN + 59_000, "prije 59 minuta"],
    [23 * HOUR + 59 * MIN, "prije 23 sata"],
    [6 * DAY + 23 * HOUR, "prije 6 dana"],
    [29 * DAY, "prije 4 sedmice"],
    [364 * DAY, "prije 12 mjeseci"],
  ])("%i ms ago (just below a threshold) -> %s", (ms, expected) =>
    expect(formatTimeAgo(ago(ms), now)).toBe(expected),
  );
  it("reads a timestamp in the future as now", () => expect(formatTimeAgo(ago(-5 * MIN), now)).toBe("sada"));
  it("returns an empty string for a missing or invalid timestamp", () => {
    expect(formatTimeAgo("", now)).toBe("");
    expect(formatTimeAgo("not a date", now)).toBe("");
  });
});

// Oracle: Node has full ICU with Bosnian relative-time data. The app builds the phrases itself
// (Chrome and Edge lack that data), so every unit is compared for more n than the thresholds reach.
describe("relativePhrase matches ICU's Bosnian relative time", () => {
  const icu = new Intl.RelativeTimeFormat("bs", { numeric: "auto" });
  it.each(["minute", "hour", "day", "week", "month", "year"] as const)("%s, n = 1..120", (unit) => {
    for (let n = 1; n <= 120; n++) expect(relativePhrase(n, unit), `${n} ${unit}`).toBe(icu.format(-n, unit));
  });
});

// Chrome and Edge 157 (Windows) resolve "bs" but format with root data: 6236.75 -> "6,236.75",
// -3 hours -> "-3 h", -1 day -> "yesterday". The stub gives "bs" the same gap; "en" formats
// numbers like root.
describe("without Bosnian number and relative-time data (Chrome, Edge)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("formats numbers with Croatian data and still says the time in Bosnian", async () => {
    const asRoot = (locales?: Intl.LocalesArgument) =>
      (Array.isArray(locales) ? locales[0] : locales) === "bs" ? "en" : locales;
    class ChromeNumberFormat extends Intl.NumberFormat {
      constructor(locales?: Intl.LocalesArgument, options?: Intl.NumberFormatOptions) {
        super(asRoot(locales), options);
      }
    }
    class ChromeRelativeTimeFormat extends Intl.RelativeTimeFormat {
      constructor(locales?: Intl.LocalesArgument, options?: Intl.RelativeTimeFormatOptions) {
        super(asRoot(locales), options);
      }
    }
    vi.stubGlobal(
      "Intl",
      Object.create(Intl, {
        NumberFormat: { value: ChromeNumberFormat },
        RelativeTimeFormat: { value: ChromeRelativeTimeFormat },
      }),
    );
    expect(new Intl.NumberFormat("bs").format(6236.75)).toBe("6,236.75");
    expect(new Intl.NumberFormat("bs").format(1234.5)).toBe("1,234.5");

    vi.resetModules();
    const chrome = await import("../format");
    expect(chrome.formatNumber(6236)).toBe("6.236");
    expect(chrome.formatNumber(0.75)).toBe("0,75");
    const now = Date.parse("2026-11-19T12:00:00Z");
    expect(chrome.formatTimeAgo(new Date(now - 3 * 60 * 60_000).toISOString(), now)).toBe("prije 3 sata");
    expect(chrome.formatTimeAgo(new Date(now - 24 * 60 * 60_000).toISOString(), now)).toBe("jučer");
  });
});
