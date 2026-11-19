/**
 * The app name lives in SITE_NAME only. The root layout turns it into the title template, so a
 * page gives just its own part and a rename is one line in src/lib/site.ts.
 */
import { describe, it, expect, vi } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

vi.mock("next/font/google", () => {
  const font = () => ({ variable: "", className: "" });
  return { Amiri: font, Noto_Naskh_Arabic: font, Scheherazade_New: font };
});
vi.mock("next/font/local", () => ({ default: () => ({ variable: "", className: "" }) }));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(__dirname, "../..");

// Hidden test mode and generated data are out of scope; tests may name the app.
const EXCLUDED = [
  path.join("src", "lib", "site.ts"),
  path.join("src", "app", "_test"),
  path.join("src", "components", "test"),
  path.join("src", "data"),
];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return name === "__tests__" ? [] : sourceFiles(full);
    return /\.tsx?$/.test(name) ? [full] : [];
  });
}

describe("page titles", () => {
  it("root layout sets the title default and template from SITE_NAME", async () => {
    const { metadata } = await import("../layout");
    expect(metadata.title).toEqual({
      default: "Elif",
      template: "%s | Elif",
    });
  });

  it("link previews use the 1200x630 image and the large card; the browser color is the accent", async () => {
    const { metadata, viewport } = await import("../layout");
    expect(metadata.openGraph?.siteName).toBe("Elif");
    expect(metadata.openGraph?.images).toEqual([{ url: "/og.png", width: 1200, height: 630, alt: "Elif" }]);
    expect(metadata.twitter).toEqual({ card: "summary_large_image" });
    expect(metadata.appleWebApp).toMatchObject({ title: "Elif" });
    expect(viewport.themeColor).toBe("#1F3A5F");
  });

  // The old name must not come back in any source file ("Elif" itself is also the letter's name).
  it("the old app name is typed in no source file", () => {
    const root = path.join(srcDir, "..");
    const offenders = sourceFiles(srcDir)
      .filter((file) => !EXCLUDED.some((ex) => path.relative(root, file).startsWith(ex)))
      .filter((file) => readFileSync(file, "utf-8").includes("Quran Learning"))
      .map((file) => path.relative(root, file));
    expect(offenders).toEqual([]);
  });
});
