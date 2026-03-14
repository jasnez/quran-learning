/**
 * Ensures production uses a different primary Arabic font than Amiri when
 * data-arabic-font is set (Naskh or Uthmanic). In a real browser, computed
 * font-family on .font-arabic will show "Noto Naskh Arabic" or "KFGQPC..."
 * depending on the attribute (check DevTools).
 */
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const globalsCssPath = path.join(__dirname, "../globals.css");
const layoutPath = path.join(__dirname, "../layout.tsx");

function* walkCssFiles(dir: string): Generator<string> {
  if (!existsSync(dir)) return;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walkCssFiles(full);
    else if (e.name.endsWith(".css")) yield full;
  }
}

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

describe("Layout: Arabic font applied on first paint", () => {
  it("html has default data-arabic-font=\"naskh\" so CSS applies before hydration", () => {
    const layout = readFileSync(layoutPath, "utf-8");
    expect(layout).toMatch(/<html[^>]*data-arabic-font="naskh"/);
  });

  it("inline script sets data-arabic-font from localStorage arabicFontStyle", () => {
    const layout = readFileSync(layoutPath, "utf-8");
    expect(layout).toMatch(/data-arabic-font/);
    expect(layout).toMatch(/arabicFontStyle/);
    expect(layout).toMatch(/setAttribute\s*\(\s*['"]data-arabic-font['"]\s*,\s*f\s*\)/);
  });
});

describe("Build output: Arabic font override in production CSS", () => {
  it.skipIf(!existsSync(path.join(process.cwd(), ".next")))(
    "built CSS includes uthmanic override (run after npm run build)",
    () => {
      const nextDir = path.join(process.cwd(), ".next");
      let combined = "";
      for (const file of walkCssFiles(nextDir)) {
        combined += readFileSync(file, "utf-8");
      }
      expect(combined).toMatch(/data-arabic-font.*uthmanic|uthmanic.*data-arabic-font/);
      expect(combined).toMatch(/--font-arabic/);
      expect(combined).toMatch(/font-uthmanic-hafs|uthmanic-hafs/);
    }
  );
});
