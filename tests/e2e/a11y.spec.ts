import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Axe regression check over the key routes, in three themes and two widths.
 * Run with `npm run test:a11y` (own config, own dev server on port 3210).
 *
 * Every route is one test; each test pushes its findings into `findings`.
 * The last test (same worker, serial) fails on any unmatched finding and on
 * any allowlist entry that matched nothing, so the list cannot go stale.
 */

const ROUTES = [
  "/",
  "/surahs",
  "/surah/1",
  "/surah/36",
  "/juz/30",
  "/learn/36",
  "/bookmarks",
  "/progress",
  "/search",
  "/duas",
  "/names",
  "/harfovi",
  "/tajwid",
  "/tajwid/mad-duljenje",
  "/about",
  "/contact",
  "/sources",
] as const;

const THEMES = ["light", "dark", "sepia"] as const;
type Theme = (typeof THEMES)[number];

const VIEWPORTS = [
  { name: "375", width: 375, height: 812 },
  { name: "1280", width: 1280, height: 800 },
] as const;

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

// Same key and shape as the zustand persist storage in src/store/settingsStore.ts
// (no `version` option there, so the stored version is 0).
const SETTINGS_KEY = "quran-learning-settings";

type AllowEntry = {
  rule: string;
  /** Limit to one route; omitted means any route. */
  route?: string;
  /** Limit to one theme; omitted means any theme. */
  theme?: Theme;
  /** Substring of the axe target selector (nodes are matched one by one). */
  target?: string;
  /** Substring of axe's failure summary (e.g. the foreground colour); use when selectors are unstable. */
  summary?: string;
  reason: string;
  phase: string;
};

// Known exceptions. Each entry must still occur, otherwise the run fails.
const ALLOWLIST: AllowEntry[] = [
  // Phase 2 (tokens): the sepia accent #6b7c2e on the sepia page background
  // #f5ecd7 is 3.92:1 for underlined body links. Fixed by changing the token,
  // not here (colours are frozen in Phase 1). One entry per route so a route
  // that gets fixed turns its entry stale.
  ...["/harfovi", "/about", "/contact", "/sources"].map(
    (route): AllowEntry => ({
      rule: "color-contrast",
      route,
      theme: "sepia",
      summary: "foreground color: #6b7c2e",
      reason: "Sepia accent link text is 3.92:1 on the sepia background (needs 4.5:1).",
      phase: "Phase 2: tokens",
    }),
  ),
  // Phase 2 (tokens): stone-500 (#79716b) muted notes on the dark background
  // #111111 are 3.94:1.
  {
    rule: "color-contrast",
    route: "/about",
    theme: "dark",
    target: ".italic",
    reason: "Muted italic note is 3.94:1 on the dark background (needs 4.5:1).",
    phase: "Phase 2: tokens",
  },
  {
    rule: "color-contrast",
    route: "/sources",
    theme: "dark",
    target: ".italic",
    reason: "Muted italic note is 3.94:1 on the dark background (needs 4.5:1).",
    phase: "Phase 2: tokens",
  },
  {
    rule: "color-contrast",
    route: "/contact",
    theme: "dark",
    target: "text-stone-500",
    reason: "Muted note (dark:text-stone-500) is 3.94:1 on the dark background (needs 4.5:1).",
    phase: "Phase 2: tokens",
  },
];

type Finding = {
  route: string;
  theme: Theme;
  viewport: string;
  rule: string;
  target: string;
  summary: string;
};

const findings: Finding[] = [];

function matches(entry: AllowEntry, f: Finding): boolean {
  return (
    entry.rule === f.rule &&
    (entry.route === undefined || entry.route === f.route) &&
    (entry.theme === undefined || entry.theme === f.theme) &&
    (entry.target === undefined || f.target.includes(entry.target)) &&
    (entry.summary === undefined || f.summary.includes(entry.summary))
  );
}

test.describe.configure({ mode: "serial" });

for (const route of ROUTES) {
  test(`axe ${route}`, async ({ browser, baseURL }) => {
    test.setTimeout(180_000);
    for (const theme of THEMES) {
      for (const vp of VIEWPORTS) {
        const context = await browser.newContext({
          baseURL,
          viewport: { width: vp.width, height: vp.height },
          serviceWorkers: "block",
        });
        try {
          await context.addInitScript(
            ([key, value]) => window.localStorage.setItem(key, value),
            [SETTINGS_KEY, JSON.stringify({ state: { theme }, version: 0 })],
          );
          const page = await context.newPage();
          await page.goto(route, { waitUntil: "load" });
          await page.waitForLoadState("networkidle");
          await expect(page.locator("h1").first()).toBeVisible();
          // The stored theme must have reached the document, or the run proves nothing.
          await expect(page.locator("html")).toHaveAttribute("data-theme", theme);

          const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
          for (const v of results.violations) {
            for (const node of v.nodes) {
              findings.push({
                route,
                theme,
                viewport: vp.name,
                rule: v.id,
                target: node.target.join(" >> "),
                summary: (node.failureSummary ?? v.help).split("\n").slice(0, 2).join(" ").trim(),
              });
            }
          }
        } finally {
          await context.close();
        }
      }
    }
  });
}

test("no unlisted violations and no stale allowlist entries", () => {
  const unmatched = findings.filter((f) => !ALLOWLIST.some((e) => matches(e, f)));
  const stale = ALLOWLIST.filter((e) => !findings.some((f) => matches(e, f)));

  const lines: string[] = [];
  if (unmatched.length > 0) {
    lines.push(`${unmatched.length} unlisted violation(s):`);
    for (const f of unmatched) {
      lines.push(`  ${f.route} [${f.theme}, ${f.viewport}px] ${f.rule}: ${f.target}\n    ${f.summary}`);
    }
  }
  if (stale.length > 0) {
    lines.push(`${stale.length} allowlist entr(ies) matched nothing:`);
    for (const e of stale) {
      lines.push(`  ${e.rule} ${e.route ?? "*"} ${e.theme ?? "*"} ${e.target ?? e.summary ?? "*"} (${e.phase})`);
    }
  }
  expect(lines.join("\n"), lines.join("\n")).toBe("");
});
