/**
 * The tajwid colors have one source: the --tj-* tokens in globals.css, used only through the
 * classes in tajwidStyles.ts. Any other file that names a tajwid token or its hex value would
 * drift from the mushaf scheme when the tokens change.
 */
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const GLOBALS = path.join(SRC, "app", "globals.css");
const STYLES = path.join(SRC, "lib", "quran", "tajwidStyles.ts");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "__tests__" ? [] : sourceFiles(full);
    return /\.(ts|tsx|css)$/.test(e.name) ? [full] : [];
  });
}

/** Hex values of the --tj-* tokens that no other token shares (#A3241B is also --danger). */
function tajwidOnlyHexes(): string[] {
  const css = readFileSync(GLOBALS, "utf-8");
  const decls = [...css.matchAll(/--([\w-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;/g)].map((m) => ({
    name: m[1],
    hex: m[2].toUpperCase(),
  }));
  const other = new Set(decls.filter((d) => !d.name.startsWith("tj-")).map((d) => d.hex));
  return [...new Set(decls.filter((d) => d.name.startsWith("tj-")).map((d) => d.hex))].filter((h) => !other.has(h));
}

describe("tajwid color source", () => {
  it("finds the tajwid token values to look for", () => {
    expect(tajwidOnlyHexes().length).toBeGreaterThanOrEqual(6);
  });

  it("no file outside globals.css and tajwidStyles.ts names a tajwid token or its color", () => {
    const hexes = tajwidOnlyHexes();
    const hits = sourceFiles(SRC)
      .filter((f) => f !== GLOBALS && f !== STYLES)
      .filter((f) => {
        const text = readFileSync(f, "utf-8");
        return /\btj-(medd|gunne|ihfa|kalkala)\b/.test(text) || hexes.some((h) => text.toUpperCase().includes(h));
      })
      .map((f) => path.relative(SRC, f));
    expect(hits).toEqual([]);
  });
});
