/**
 * The web app manifest and icons after the rename to "Elif" (Phase 2). Installed PWAs pick up the
 * new name and icon from the same manifest URL, so everything that identifies the app to the
 * browser (start_url, display, service-worker cache names) stays as it was.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(path.join(root, rel));

type Manifest = {
  name: string;
  short_name: string;
  start_url: string;
  display: string;
  orientation?: string;
  theme_color: string;
  background_color: string;
  icons: { src: string; sizes: string; type: string; purpose: string }[];
};

/** Width and height from a PNG's IHDR chunk. */
function pngSize(rel: string): [number, number] {
  const png = read(rel);
  expect(png.subarray(1, 4).toString("ascii"), rel).toBe("PNG");
  return [png.readUInt32BE(16), png.readUInt32BE(20)];
}

describe("manifest and icons", () => {
  const manifest = JSON.parse(read("public/manifest.webmanifest").toString("utf8")) as Manifest;

  it("names the app Elif, keeps its start URL and display, and locks no orientation", () => {
    expect(manifest.name).toBe("Elif");
    expect(manifest.short_name).toBe("Elif");
    expect(manifest.start_url).toBe("/");
    expect(manifest.display).toBe("standalone");
    // WCAG 1.3.4: the app must not lock the screen to one orientation.
    expect(manifest.orientation).toBeUndefined();
  });

  it("takes its colors from the light Tezhib tokens", () => {
    expect(manifest.theme_color).toBe("#1F3A5F");
    expect(manifest.background_color).toBe("#F7F4ED");
  });

  it("has the 192, 512 and maskable 512 icons at their stated pixel sizes, and the iOS icon", () => {
    const icons = manifest.icons.map((i) => `${i.src} ${i.sizes} ${i.purpose}`);
    expect(icons).toEqual([
      "/icons/icon-192.png 192x192 any",
      "/icons/icon-512.png 512x512 any",
      "/icons/icon-maskable-512.png 512x512 maskable",
    ]);
    for (const icon of manifest.icons) {
      const [w, h] = pngSize(path.join("public", icon.src));
      expect(`${w}x${h}`, icon.src).toBe(icon.sizes);
    }
    expect(pngSize("src/app/apple-icon.png")).toEqual([180, 180]);
    expect(pngSize("public/og.png")).toEqual([1200, 630]);
  });

  it("the mark is drawn with shapes only, no text", () => {
    const svg = read("public/icons/elif-mark.svg").toString("utf8");
    expect(svg).toMatch(/^<svg[^>]+viewBox="0 0 64 64"/);
    expect(svg).not.toMatch(/<text|font-family/);
    expect(read("src/app/icon.svg").toString("utf8")).toBe(svg);
  });

  it("keeps the service worker's cache names, so saved surahs survive the rename", () => {
    const sw = read("public/sw.js").toString("utf8");
    expect(sw).toContain('const SHELL_CACHE = "quran-shell-v1";');
    expect(sw).toContain('const STATIC_CACHE = "quran-static-v1";');
    expect(sw).toContain('const API_CACHE = "quran-api-v1";');
  });
});
