/**
 * Guard for the copy deck: user-visible text stays neutral (no "Vi" address), says
 * "aplikacija" not "platforma", keeps placeholders free of "...", and has no emoji or
 * arrows. It scans the source, so it also catches strings in constants and metadata.
 */
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

// Test fixtures, data and the test pages keep their own text.
const SKIPPED_DIRS = [["data"], ["app", "_test"], ["components", "test"]];

function isScanned(relative: string): boolean {
  if (!/\.tsx?$/.test(relative)) return false;
  const parts = relative.split(path.sep);
  if (parts.includes("__tests__")) return false;
  return !SKIPPED_DIRS.some((dir) => dir.every((segment, i) => parts[i] === segment));
}

function isCommentLine(line: string): boolean {
  const t = line.trim();
  return t.startsWith("//") || t.startsWith("*") || t.startsWith("/*") || t.startsWith("{/*");
}

type Line = { file: string; number: number; text: string };

function codeLines(): Line[] {
  const lines: Line[] = [];
  for (const relative of readdirSync(SRC, { recursive: true, encoding: "utf-8" })) {
    if (!isScanned(relative)) continue;
    readFileSync(path.join(SRC, relative), "utf-8")
      .split(/\r?\n/)
      .forEach((text, i) => {
        if (!isCommentLine(text)) lines.push({ file: relative.split(path.sep).join("/"), number: i + 1, text });
      });
  }
  return lines;
}

function offenders(pattern: RegExp): string[] {
  return codeLines()
    .filter((l) => pattern.test(l.text))
    .map((l) => `${l.file}:${l.number}: ${l.text.trim()}`);
}

// JavaScript \b does not work next to letters like c, s, z with a caron or acute, so use Unicode-aware boundaries.
const word = (source: string, flags = "iu") => new RegExp(`(?<!\\p{L})(?:${source})(?!\\p{L})`, flags);

describe("copy rules", () => {
  it("scans the app source (guards against a broken file filter)", () => {
    const files = new Set(codeLines().map((l) => l.file));
    expect(files.has("components/home/HeroSection.tsx") || files.size > 50).toBe(true);
    expect([...files].some((f) => f.startsWith("data/"))).toBe(false);
    expect([...files].some((f) => f.includes("__tests__"))).toBe(false);
  });

  it("does not address the reader with Vi (neutral wording instead)", () => {
    const lower = word(
      [
        "ste",
        "nemate",
        "imate",
        "pokušajte",
        "provjerite",
        "označite",
        "osvježite",
        "počnite",
        "pišite",
        "upisujte",
        "možete",
        "navedite",
        "primijetite",
        "uočite",
        "javite",
        "unesite",
        "čitate",
        "kontaktirajte",
      ].join("|"),
    );
    const capitalised = word("Vam|Vas|Vaš\\p{L}*", "u");
    expect([...offenders(lower), ...offenders(capitalised)]).toEqual([]);
  });

  it("has no gendered slash forms like /la", () => {
    expect(offenders(/\/la /)).toEqual([]);
  });

  it("does not use tražio", () => {
    expect(offenders(/tražio/)).toEqual([]);
  });

  it("says aplikacija, not platforma (the platform identifier is not copy)", () => {
    expect(offenders(word("platform[aeiou]\\p{L}*"))).toEqual([]);
  });

  it("has no ... inside a placeholder", () => {
    expect(offenders(/placeholder\s*[=:]\s*\{?\s*["'`][^"'`]*\.\.\./i)).toEqual([]);
    expect(offenders(/PLACEHOLDER\s*=\s*["'`][^"'`]*\.\.\./)).toEqual([]);
  });

  it("has no emoji (U+1F300-U+1FAFF)", () => {
    const emoji = new RegExp(`[${String.fromCodePoint(0x1f300)}-${String.fromCodePoint(0x1faff)}]`, "u");
    expect(offenders(emoji)).toEqual([]);
  });

  it("has no arrows in text (left, right, north east)", () => {
    const arrows = new RegExp(`[${[0x2190, 0x2192, 0x2197].map((c) => String.fromCodePoint(c)).join("")}]`);
    expect(offenders(arrows)).toEqual([]);
  });
});
