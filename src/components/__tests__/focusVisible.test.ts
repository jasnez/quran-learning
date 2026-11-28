/**
 * WCAG 2.4.7 / 2.4.11: the focus ring must stay visible in forced-colors mode and
 * focused elements must not hide under the fixed bars. Tailwind 4 `outline-none` is
 * `outline-style: none`, which also removes the outline Windows high-contrast mode shows;
 * `outline-hidden` keeps a transparent outline that forced-colors mode paints.
 * jsdom has no CSS, so this guards the source contract.
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

describe("focus visibility", () => {
  it("no component uses outline-none (use outline-hidden)", () => {
    const offenders = sourceFiles()
      .filter((file) => /outline-none/.test(readFileSync(file, "utf-8")))
      .map((file) => path.relative(SRC, file));
    expect(offenders).toEqual([]);
  });

  it("globals.css reserves scroll padding for the fixed bars on html", () => {
    const css = readFileSync(path.join(SRC, "app/globals.css"), "utf-8");
    expect(css).toMatch(/html\s*\{[^}]*scroll-padding-top:/);
    // The bottom padding follows --bars-bottom, which grows by the player while audio is loaded.
    expect(css).toMatch(/html\s*\{[^}]*scroll-padding-bottom:\s*calc\(var\(--bars-bottom\)/);
    expect(css).toMatch(/:root:has\(\[data-audio-player\]\)\s*\{[^}]*--bar-player-now:\s*var\(--bar-player\)/);
  });
});
