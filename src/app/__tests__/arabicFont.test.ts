/**
 * Ensures production uses a different primary Arabic font than Amiri when
 * data-arabic-font is set (Naskh or Uthmanic). In a real browser, computed
 * font-family on .font-arabic will show "Noto Naskh Arabic" or "KFGQPC..."
 * depending on the attribute (check DevTools).
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const globalsCssPath = path.join(__dirname, "../globals.css");

describe("Arabic font (production: font other than Amiri)", () => {
  it("globals.css defines naskh with --font-naskh-arabic as primary (not only Amiri)", () => {
    const css = readFileSync(globalsCssPath, "utf-8");
    expect(css).toMatch(/html\[data-arabic-font="naskh"\][\s\S]*?--font-arabic:\s*var\(--font-naskh-arabic\)/);
    expect(css).toMatch(/--font-naskh-arabic/);
  });

  it("globals.css defines uthmanic with --font-uthmanic-hafs as primary (not only Amiri)", () => {
    const css = readFileSync(globalsCssPath, "utf-8");
    expect(css).toMatch(/html\[data-arabic-font="uthmanic"\][\s\S]*?--font-arabic:\s*var\(--font-uthmanic-hafs\)/);
    expect(css).toMatch(/--font-uthmanic-hafs/);
  });

  it(".font-arabic uses var(--font-arabic) so switch takes effect", () => {
    const css = readFileSync(globalsCssPath, "utf-8");
    expect(css).toMatch(/\.font-arabic[\s\S]*?font-family:\s*var\(--font-arabic\)/);
  });
});
