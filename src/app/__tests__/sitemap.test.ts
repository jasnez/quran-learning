/**
 * @vitest-environment node
 *
 * sitemap.xml and robots.txt (QA section 7). The sitemap lists its static pages by hand, so
 * this test fails when a new page is neither in it nor in EXCLUDED below.
 */
import { describe, it, expect } from "vitest";
import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sitemap from "../sitemap";
import robots from "../robots";
import { SITE_URL } from "@/lib/site";

const APP_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Pages that show only the visitor's own data or an empty search. */
const EXCLUDED = ["/bookmarks", "/progress", "/search", "/settings"];

/** Route patterns of every page.tsx, e.g. "/surah/[surahId]". Private folders (_x) are not routes. */
function pageRoutes(dir: string, route = ""): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const routes = entries.some((e) => e.isFile() && e.name === "page.tsx") ? [route || "/"] : [];
  for (const e of entries) {
    if (!e.isDirectory() || e.name.startsWith("_") || e.name === "__tests__") continue;
    routes.push(...pageRoutes(path.join(dir, e.name), `${route}/${e.name}`));
  }
  return routes;
}

function toRegExp(route: string): RegExp {
  const pattern = route.replace(/\[[^\]]+\]/g, "[^/]+");
  return new RegExp(`^${pattern === "/" ? "/?" : pattern}$`);
}

describe("sitemap.xml", () => {
  it("lists absolute URLs on the canonical domain, each once", async () => {
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls.length).toBeGreaterThan(114 * 2 + 30);
    expect(new Set(urls).size).toBe(urls.length);
    for (const url of urls) expect(url.startsWith(SITE_URL)).toBe(true);
    expect(urls).toContain(SITE_URL);
    expect(urls).toContain(`${SITE_URL}/surah/114`);
    expect(urls).toContain(`${SITE_URL}/juz/30`);
  });

  it("covers every page route except the personal ones", async () => {
    const paths = (await sitemap()).map((e) => e.url.slice(SITE_URL.length) || "/");
    for (const route of pageRoutes(APP_DIR)) {
      const listed = paths.some((p) => toRegExp(route).test(p));
      expect({ route, listed }).toEqual({ route, listed: !EXCLUDED.includes(route) });
    }
  });
});

describe("robots.txt", () => {
  it("allows everything and points to the sitemap", () => {
    expect(robots()).toEqual({
      rules: { userAgent: "*", allow: "/" },
      sitemap: `${SITE_URL}/sitemap.xml`,
    });
  });
});
