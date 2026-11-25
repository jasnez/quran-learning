/**
 * Gunne dots and ihfa dashes ("Tedzvid: boje i linije") are a background pattern in globals.css,
 * not a dotted or dashed underline: under one narrow letter an underline shrinks to a single dot
 * or dash. jsdom draws nothing, so these tests read the CSS; the look is checked in Chromium,
 * Firefox and WebKit by hand (docs/TAJWID.md).
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const GLOBALS = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../../app/globals.css");
const css = readFileSync(GLOBALS, "utf-8");

/** The body of the first block that starts with `prelude {`, braces matched. */
function blockBody(source: string, prelude: string): string {
  const start = source.indexOf(`${prelude} {`);
  if (start < 0) return "";
  let depth = 0;
  for (let i = source.indexOf("{", start); i < source.length; i++) {
    if (source[i] === "{") depth++;
    if (source[i] === "}" && --depth === 0) return source.slice(source.indexOf("{", start) + 1, i);
  }
  return "";
}

/** The declarations of every rule whose selector list is exactly `selector`, starting a line. */
function ruleBody(source: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(?:^|\\n)[ \\t]*${escaped}\\s*\\{([^}]*)\\}`, "g");
  return [...source.matchAll(re)].map((m) => m[1]).join("\n");
}

const patterns = blockBody(css, "@media (forced-colors: none)");

describe("tajwid line patterns (globals.css)", () => {
  it("live only in a forced-colors: none block, so forced colors keep the underline", () => {
    expect(patterns).not.toBe("");
    const outside = css.replace(patterns, "");
    expect(outside).not.toMatch(/\.tj-line-(dots|dashes)/);
  });

  it("replace the underline with a repeating pattern in the letter's color, only under data-tajwid-lines", () => {
    const shared = ruleBody(patterns, "[data-tajwid-lines] .tj-line-dots,\n  [data-tajwid-lines] .tj-line-dashes");
    expect(shared).toMatch(/text-decoration-line:\s*none;/);
    // "round": whole marks only, scaled to fit, so a narrow letter still gets two.
    expect(shared).toMatch(/background-repeat:\s*round no-repeat;/);
    const dots = ruleBody(patterns, "[data-tajwid-lines] .tj-line-dots");
    const dashes = ruleBody(patterns, "[data-tajwid-lines] .tj-line-dashes");
    expect(dots).toMatch(/background-image:\s*radial-gradient\([^;]*currentColor/);
    expect(dashes).toMatch(/background-image:\s*linear-gradient\([^;]*currentColor/);
    // "round" fits whole tiles from the edge; "center" would shift an even count by half a tile
    // and cut the first and last mark.
    expect(dots).toMatch(/background-position:\s*left bottom /);
    expect(dashes).toMatch(/background-position:\s*left bottom /);
  });

  it("sit at the underline's height (0.45em below the baseline, 2px) for each font", () => {
    // A background is placed from the bottom of the text box; this is that box's depth below the
    // baseline per font, measured the same in Chromium, Firefox and WebKit (2026-11-25).
    expect(ruleBody(css, ":root")).toMatch(/--tajwid-line-descent:\s*0\.429em;/);
    expect(ruleBody(css, ".font-arabic")).toMatch(/--tajwid-line-descent:\s*0\.643em;/);
    expect(ruleBody(css, 'html[data-arabic-font="uthmanic"] .font-arabic')).toMatch(/--tajwid-line-descent:\s*0\.714em;/);
    expect(patterns).toMatch(/--tajwid-line-bottom:\s*calc\(var\(--tajwid-line-descent\) - 0\.45em - 2px\);/);
  });

  it("reach the legend sample's line: its box is padded below the UI font's 0.429em", () => {
    // A background is not drawn outside its box, and in the UI font the line (0.45em + 2px) lies
    // below the box. Inline padding moves the box bottom down without changing the line height.
    const sample = ruleBody(css, ".tj-line-sample");
    expect(sample).toMatch(/padding-bottom:\s*0\.25em;/);
    expect(sample).toMatch(/--tajwid-line-descent:\s*0\.679em;/);
  });
});
