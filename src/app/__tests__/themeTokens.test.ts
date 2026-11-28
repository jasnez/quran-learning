/**
 * The Tezhib tokens in globals.css: values exactly as in the developer handoff "Tezhib u kodu"
 * (2026-11-19), and the contrast of every pair the handoff says the tokens are used in.
 */
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { contrastRatio } from "@/lib/theme/contrast";

const CSS = readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), "../globals.css"),
  "utf-8",
).replace(/\/\*[\s\S]*?\*\//g, "");

const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

/** Every file under dir whose name matches, skipping __tests__ folders. */
function sourceFiles(dir: string, name: RegExp): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "__tests__" ? [] : sourceFiles(full, name);
    return name.test(e.name) ? [full] : [];
  });
}

const THEMES = ["light", "sepia", "dark"] as const;
type Theme = (typeof THEMES)[number];

// token: [light, sepia, dark]
const EXPECTED: Record<string, [string, string, string]> = {
  paper: ["#F7F4ED", "#F1E8D5", "#10141B"],
  surface: ["#FFFDF8", "#F8F1E2", "#171D27"],
  "surface-sunken": ["#EFE9DC", "#E9DDC4", "#0C1015"],
  ink: ["#1E1B16", "#33281A", "#ECE6DA"],
  "ink-muted": ["#5F584A", "#64543D", "#A69F91"],
  line: ["#E2DBCB", "#DCCDB0", "#2A3242"],
  "line-strong": ["#8A8170", "#8A7A5E", "#6B7486"],
  accent: ["#1F3A5F", "#22406B", "#3B5F95"],
  "accent-hover": ["#182E4C", "#1B3456", "#4A6FA8"],
  "accent-text": ["#1F3A5F", "#22406B", "#A9C3EC"],
  "accent-wash": ["#E3E9F2", "#DEDCD4", "#1F2A3D"],
  "on-accent": ["#FFFFFF", "#FFFFFF", "#FFFFFF"],
  gold: ["#A9843A", "#977532", "#D4B46C"],
  highlight: ["#F1E6CC", "#E8D9B5", "#2A2618"],
  mark: ["#F3DF9B", "#EBD38A", "#4A3F1A"],
  danger: ["#A3241B", "#A3241B", "#C2453B"],
  "danger-text": ["#A3241B", "#A3241B", "#F2A196"],
  "success-text": ["#2E6B34", "#2B6631", "#9BD3A0"],
  "warning-text": ["#7A5200", "#734D00", "#E8C27A"],
  "tj-medd": ["#B3261E", "#A3241B", "#FF8A80"],
  "tj-gunne": ["#2E7D32", "#2B6E2F", "#81C784"],
  "tj-ihfa": ["#2E7D32", "#2B6E2F", "#81C784"],
  "tj-kalkala": ["#0E72A8", "#0B6A9C", "#64B5F6"],
};

const OVERLAY: Record<Theme, string> = {
  light: "rgb(16 20 27 / 0.5)",
  sepia: "rgb(51 40 26 / 0.45)",
  dark: "rgb(0 0 0 / 0.6)",
};

function selectorMatches(selector: string, theme: Theme): boolean {
  const parts = selector.split(",").map((s) => s.trim());
  if (theme === "light") return parts.includes(":root") && parts.includes('[data-theme="light"]');
  return parts.includes(`[data-theme="${theme}"]`);
}

/** All custom-property declarations of the top-level blocks whose selector names this theme. */
function themeVars(theme: Theme): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const block of CSS.matchAll(/([^{};]+)\{([^{}]*)\}/g)) {
    if (!selectorMatches(block[1], theme)) continue;
    for (const decl of block[2].matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
      vars[decl[1]] = decl[2].trim();
    }
  }
  return vars;
}

function themeInline(): Record<string, string> {
  const body = CSS.match(/@theme inline\s*\{([^}]*)\}/)?.[1] ?? "";
  return Object.fromEntries([...body.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
}

const AA_TEXT = 4.5;
const NON_TEXT = 3;

// [foreground, background, minimum]
const PAIRS: [string, string, number][] = [
  ...["ink", "ink-muted", "accent-text", "danger-text", "success-text", "warning-text"].flatMap(
    (fg): [string, string, number][] => [
      [fg, "paper", AA_TEXT],
      [fg, "surface", AA_TEXT],
    ],
  ),
  ...["surface-sunken", "highlight", "mark", "accent-wash"].map((bg): [string, string, number] => ["ink", bg, AA_TEXT]),
  ["accent-text", "accent-wash", AA_TEXT],
  // The border of a chosen option: what makes it a shape on the sunken track of a ChoiceGroup,
  // where the wash alone is 1.01:1 (light).
  ["accent-text", "surface-sunken", NON_TEXT],
  ["on-accent", "accent", AA_TEXT],
  ["on-accent", "accent-hover", AA_TEXT],
  ["on-accent", "danger", AA_TEXT],
  ...["line-strong", "gold"].flatMap((fg): [string, string, number][] => [
    [fg, "paper", NON_TEXT],
    [fg, "surface", NON_TEXT],
  ]),
  // Tajwid colors: large Arabic text and lines (3:1) on every background tajwid text is drawn on;
  // small text in a rule color (lesson card chip) on paper and surface (4.5:1).
  ...["tj-medd", "tj-gunne", "tj-ihfa", "tj-kalkala"].flatMap((fg): [string, string, number][] => [
    ...["paper", "surface", "surface-sunken", "highlight", "mark"].map((bg): [string, string, number] => [fg, bg, NON_TEXT]),
    [fg, "paper", AA_TEXT],
    [fg, "surface", AA_TEXT],
  ]),
];

describe("Tezhib tokens", () => {
  it.each(THEMES)("%s: every token has the handoff's value", (theme) => {
    const vars = themeVars(theme);
    const i = THEMES.indexOf(theme);
    const actual = Object.fromEntries(Object.keys(EXPECTED).map((t) => [t, vars[t]?.toUpperCase()]));
    const expected = Object.fromEntries(Object.entries(EXPECTED).map(([t, v]) => [t, v[i]]));
    expect(actual).toEqual(expected);
    expect(vars.overlay).toBe(OVERLAY[theme]);
  });

  it.each(THEMES)("%s: every pair the tokens are used in has enough contrast", (theme) => {
    const vars = themeVars(theme);
    const failures = PAIRS.map(([fg, bg, min]) => ({ fg, bg, min, ratio: contrastRatio(vars[fg], vars[bg]) }))
      .filter((p) => p.ratio < p.min)
      .map((p) => `${theme}: ${p.fg} on ${p.bg} is ${p.ratio.toFixed(2)}:1 (needs ${p.min}:1)`);
    expect(failures).toEqual([]);
  });

  it("has retired the old palette: no --theme-* variables, page background and text are tokens", () => {
    expect(CSS).not.toMatch(/--theme-[\w-]+\s*:/);
    for (const theme of THEMES) {
      const vars = themeVars(theme);
      expect(vars.background, theme).toBe("var(--paper)");
      expect(vars.foreground, theme).toBe("var(--ink)");
    }
    const sepia = themeVars("sepia");
    expect(sepia["color-stone-500"]).toBeUndefined();
    expect(sepia["color-amber-600"]).toBeUndefined();
    expect(sepia["color-amber-700"]).toBeUndefined();
    // Themes switch on data-theme only; the .dark class and Tailwind's dark: variant are gone.
    expect(CSS).not.toMatch(/@custom-variant\s+dark/);
  });

  it.each(THEMES)("%s: ihfa has the same color as gunne (one green for through the nose)", (theme) => {
    const vars = themeVars(theme);
    expect(vars["tj-ihfa"]).toBe(vars["tj-gunne"]);
  });

  it("no source file uses Tailwind's dark: variant (it no longer applies)", () => {
    // Also stacked variants ("md:dark:"), and the dark selector or variant in any stylesheet.
    const hits = [
      ...sourceFiles(SRC, /\.(ts|tsx)$/).filter((f) => /(^|[\s"'`:])dark:/m.test(readFileSync(f, "utf-8"))),
      ...sourceFiles(SRC, /\.css$/).filter((f) =>
        /\.dark\b|@(custom-)?variant\s+dark\b/.test(readFileSync(f, "utf-8").replace(/\/\*[\s\S]*?\*\//g, "")),
      ),
    ];
    expect(hits.map((f) => path.relative(SRC, f))).toEqual([]);
  });

  it("maps every color token and the radii into Tailwind's theme", () => {
    const theme = themeInline();
    for (const token of [...Object.keys(EXPECTED), "overlay"]) {
      expect(theme[`color-${token}`], token).toBe(`var(--${token})`);
    }
    expect(theme["radius-control"]).toBe("0.625rem");
    expect(theme["radius-card"]).toBe("0.875rem");
    expect(theme["radius-sheet"]).toBe("1.25rem");
  });
});
