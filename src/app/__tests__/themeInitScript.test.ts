// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { THEME_INIT_SCRIPT } from "../themeInitScript";

const KEY = "quran-learning-settings";

function run() {
  new Function(THEME_INIT_SCRIPT)();
}

describe("THEME_INIT_SCRIPT (inline theme script in <head>)", () => {
  beforeEach(() => {
    localStorage.clear();
    const html = document.documentElement;
    html.removeAttribute("data-theme");
    html.setAttribute("data-arabic-font", "naskh");
    html.classList.remove("dark");
  });

  it("is syntactically valid JavaScript", () => {
    expect(() => new Function(THEME_INIT_SCRIPT)).not.toThrow();
  });

  it("applies a persisted dark theme and Uthmani font", () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({ state: { theme: "dark", arabicFontStyle: "uthmanic" }, version: 0 })
    );
    run();
    const html = document.documentElement;
    expect(html.getAttribute("data-theme")).toBe("dark");
    expect(html.classList.contains("dark")).toBe(false);
    expect(html.getAttribute("data-arabic-font")).toBe("uthmanic");
  });

  it("applies sepia without adding the dark class", () => {
    localStorage.setItem(KEY, JSON.stringify({ state: { theme: "sepia" } }));
    run();
    const html = document.documentElement;
    expect(html.getAttribute("data-theme")).toBe("sepia");
    expect(html.classList.contains("dark")).toBe(false);
  });

  it("sets data-tajwid-lines before paint only when colors and lines are both on", () => {
    const html = document.documentElement;
    const cases: [boolean, boolean, boolean][] = [
      [true, true, true],
      [true, false, false],
      [false, true, false],
    ];
    for (const [colors, lines, present] of cases) {
      html.removeAttribute("data-tajwid-lines");
      localStorage.setItem(KEY, JSON.stringify({ state: { theme: "light", showTajwidColors: colors, showTajwidLines: lines } }));
      run();
      expect(html.hasAttribute("data-tajwid-lines"), `colors ${colors}, lines ${lines}`).toBe(present);
    }
  });

  it("does nothing and does not throw when storage is empty or corrupt", () => {
    run();
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
    localStorage.setItem(KEY, "{not json");
    expect(run).not.toThrow();
    expect(document.documentElement.getAttribute("data-arabic-font")).toBe("naskh");
  });
});
