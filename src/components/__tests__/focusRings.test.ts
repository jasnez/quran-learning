/**
 * QA section 5: a focus indicator needs 3:1 against what is around it (WCAG 1.4.11).
 * emerald-500 is about 2.5:1 on white, emerald-400 less, and the translucent rings (/20, /40)
 * less still. Solid emerald-600 is 3.1-4.2:1 on the light, sepia and dark backgrounds.
 * jsdom has no CSS, so this guards the class contract; the contrast was measured in a browser.
 */
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

function sourceFiles(): string[] {
  return readdirSync(SRC, { recursive: true, encoding: "utf-8" })
    .filter((f) => f.endsWith(".tsx") && !f.split(path.sep).includes("__tests__"))
    .map((f) => path.join(SRC, f));
}

// The ring or border color of a focus state; ring-offset-* is the gap width, not a color.
const FOCUS_RING = /\b(?:focus|focus-visible|has-\[:focus-visible\]):(?:ring|border)-(?!offset-)([a-z]+-\d+(?:\/\d+)?)/g;

describe("focus indicators", () => {
  it("every focus ring and focus border is solid emerald-600", () => {
    const offenders: string[] = [];
    for (const file of sourceFiles()) {
      const text = readFileSync(file, "utf-8");
      for (const match of text.matchAll(FOCUS_RING)) {
        if (match[1] !== "emerald-600") offenders.push(`${path.relative(SRC, file)}: ${match[0]}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
