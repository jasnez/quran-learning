/**
 * The transcription line is set in a self-hosted subset of Gentium Book Plus (SIL OFL)
 * because Geist lacks most letters of the IZ BiH "specijal" system and no Google Fonts
 * subset contains U+0331. Regenerate the subset with scripts/subset-transliteration-font.py.
 */
import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { QURANIC_DUAS } from "@/lib/duas/data";
import { ALLAH_NAMES } from "@/lib/names/data";
import { ARABIC_LETTERS, ARABIC_VOWELS } from "@/lib/letters/data";
import { getAllTajwidLessons } from "@/data/tajwid-lessons";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fontsDir = path.join(__dirname, "../fonts");
const dataDir = path.join(__dirname, "../../data");
const layoutPath = path.join(__dirname, "../layout.tsx");

type Coverage = { files: Record<string, { sha256: string; codepoints: number[] }> };

function readCoverage(): Coverage {
  return JSON.parse(readFileSync(path.join(fontsDir, "gentium-coverage.json"), "utf8")) as Coverage;
}

/** Every string stored under a "transliteration" key, at any depth of a JSON value. */
function collectTransliterations(value: unknown, out: string[]): void {
  if (Array.isArray(value)) {
    for (const v of value) collectTransliterations(v, out);
  } else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      if (k === "transliteration" && typeof v === "string") out.push(v);
      else collectTransliterations(v, out);
    }
  }
}

function hasArabic(s: string): boolean {
  return [...s].some((ch) => {
    const cp = ch.codePointAt(0)!;
    return cp >= 0x0600 && cp <= 0x06ff;
  });
}

function jsonFiles(dir: string): string[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => path.join(dir, f));
}

describe("transliteration font", () => {
  it("both subsets cover every code point of the transcription data, U+0331 included", async () => {
    const texts: string[] = [];
    for (const f of jsonFiles(path.join(dataDir, "ayahs"))) {
      collectTransliterations(JSON.parse(readFileSync(f, "utf8")), texts);
    }
    // The particle files are keyed by the transcription text itself.
    for (const f of jsonFiles(path.join(dataDir, "transliteration"))) {
      const json = JSON.parse(readFileSync(f, "utf8")) as Record<string, unknown>;
      for (const [k, v] of Object.entries(json)) {
        texts.push(...[k, v].filter((s): s is string => typeof s === "string" && !hasArabic(s)));
      }
    }
    texts.push(...QURANIC_DUAS.map((d) => d.transliteration));
    texts.push(...ALLAH_NAMES.map((n) => n.transliteration));
    for (const l of [...ARABIC_LETTERS, ...ARABIC_VOWELS]) texts.push(l.general, l.special, l.dmg);
    for (const lesson of await getAllTajwidLessons()) {
      collectTransliterations(lesson, texts);
    }

    const needed = new Set<number>();
    for (const t of texts) for (const ch of t) needed.add(ch.codePointAt(0)!);
    expect(needed.has(String.fromCodePoint(0x0331).codePointAt(0)!)).toBe(true);

    const coverage = readCoverage();
    const names = Object.keys(coverage.files);
    expect(names.sort()).toEqual([
      "GentiumBookPlus-Italic-subset.woff2",
      "GentiumBookPlus-Regular-subset.woff2",
    ]);
    for (const name of names) {
      const have = new Set(coverage.files[name].codepoints);
      const missing = [...needed].filter((cp) => !have.has(cp)).map((cp) => cp.toString(16));
      expect(missing, `${name} lacks code points`).toEqual([]);
    }
  });

  it("the sha256 in the coverage file matches the committed .woff2 bytes", () => {
    const coverage = readCoverage();
    for (const [name, info] of Object.entries(coverage.files)) {
      const bytes = readFileSync(path.join(fontsDir, name));
      expect(createHash("sha256").update(bytes).digest("hex"), name).toBe(info.sha256);
    }
  });

  it("layout.tsx registers --font-gentium through next/font/local", () => {
    const layout = readFileSync(layoutPath, "utf8");
    expect(layout).toMatch(/from "next\/font\/local"/);
    expect(layout).toContain('variable: "--font-gentium"');
    expect(layout).toContain("gentiumBookPlus.variable");
  });
});
