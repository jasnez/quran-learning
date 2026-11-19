/**
 * The app's Latin text is set in two self-hosted subsets (SIL OFL), built by
 * scripts/subset-fonts.py: "Elif Book" (Gentium Book Plus) for transcription, translation and
 * page titles, "Elif Sans" (Source Sans 3) for the interface. No Google Fonts subset contains
 * U+0331, the transcription's s with line below. The OFL fonts reserve the names "Gentium" and
 * "Source", so the families, the files and the CSS names say "Elif".
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
const srcDir = path.join(__dirname, "../..");
const layoutPath = path.join(__dirname, "../layout.tsx");
const globalsPath = path.join(__dirname, "../globals.css");

type Coverage = { files: Record<string, { sha256: string; codepoints: number[] }> };

function readCoverage(): Coverage {
  return JSON.parse(readFileSync(path.join(fontsDir, "font-coverage.json"), "utf8")) as Coverage;
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

const FONT_FILES = ["ElifBook-Bold.woff2", "ElifBook-Regular.woff2", "ElifSans.woff2"];
const LATIN_RANGES: [number, number][] = [
  [0x0020, 0x024f],
  [0x0250, 0x02ff],
  [0x0300, 0x036f],
  [0x1e00, 0x1eff],
  [0x2000, 0x206f],
];

/** Every Latin-range code point in the app's sources and data (the text the fonts must set). */
function latinCodePointsInSrc(): Set<number> {
  const cps = new Set<number>();
  for (let cp = 0x20; cp < 0x7f; cp++) cps.add(cp);
  for (const rel of readdirSync(srcDir, { recursive: true, encoding: "utf-8" })) {
    if (!/\.(tsx?|json)$/.test(rel)) continue;
    for (const ch of readFileSync(path.join(srcDir, rel), "utf8")) {
      const cp = ch.codePointAt(0)!;
      if (LATIN_RANGES.some(([lo, hi]) => cp >= lo && cp <= hi)) cps.add(cp);
    }
  }
  return cps;
}

describe("Elif fonts", () => {
  it("every subset covers every Latin code point used in src, Bosnian letters included", () => {
    const needed = latinCodePointsInSrc();
    for (const ch of "čćđšžČĆĐŠŽ") expect(needed.has(ch.codePointAt(0)!), ch).toBe(true);
    const coverage = readCoverage();
    expect(Object.keys(coverage.files).sort()).toEqual(FONT_FILES);
    for (const [name, info] of Object.entries(coverage.files)) {
      const have = new Set(info.codepoints);
      const missing = [...needed].filter((cp) => !have.has(cp)).map((cp) => cp.toString(16));
      expect(missing, `${name} lacks code points`).toEqual([]);
    }
  });

  it("both Elif Book subsets cover every code point of the transcription data, U+0331 included", async () => {
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
    for (const name of ["ElifBook-Regular.woff2", "ElifBook-Bold.woff2"]) {
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

  // next/font names the @font-face family after the const, so the consts must not say
  // "Gentium" or "Source" either.
  it("layout.tsx registers both families through next/font/local and no longer loads Geist", () => {
    const layout = readFileSync(layoutPath, "utf8");
    expect(layout).toMatch(/from "next\/font\/local"/);
    expect(layout).toContain("const elifSans = localFont(");
    expect(layout).toContain('variable: "--font-elif-sans"');
    expect(layout).toContain("const elifBook = localFont(");
    expect(layout).toContain('variable: "--font-elif-book"');
    expect(layout).toContain("elifSans.variable");
    expect(layout).toContain("elifBook.variable");
    expect(layout).not.toMatch(/Geist/);
    expect(layout).toMatch(/Noto_Naskh_Arabic\(\{\s*weight: \["400", "600"\]/);
    const css = readFileSync(globalsPath, "utf8");
    expect(css).toContain("--font-sans: var(--font-elif-sans),");
    expect(css).toContain("--font-read: var(--font-elif-book),");
    expect(css).toContain("--font-transliteration: var(--font-elif-book),");
  });

  it("no font file, CSS name or font const is named after a reserved font name", () => {
    expect(readdirSync(fontsDir).filter((f) => f.endsWith(".woff2") && /gentium|source/i.test(f))).toEqual([]);
    const layout = readFileSync(layoutPath, "utf8");
    expect(layout).not.toMatch(/const \w*(gentium|source)\w* = localFont/i);
  });
});
