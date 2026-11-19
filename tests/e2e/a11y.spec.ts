import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Axe regression check over the key routes, in three themes and two widths.
 *
 * Run: `npm run test:a11y` (own config, own dev server on port 3210; fails if
 * another `next dev` of this worktree is running). A full run takes about
 * 7.5 minutes on this machine, mostly dev-server compiles. CI does not run it.
 *
 * Every route is one test and fails on its own with a readable list of
 * violations that are not allowlisted. The last test checks that every
 * allowlisted target still occurs; it only judges routes that ran, so a
 * partial run (`--grep`, one route) gives no false "stale" errors, but the
 * stale check is complete only for a full run. If a route test fails, the
 * last test is skipped (serial mode); fix that route first.
 *
 * Allowlist entries name rule, route, theme and the exact axe targets
 * (`node.target` joined with " >> "); a node is allowed only on an exact match.
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
  route: string;
  theme: Theme;
  /** Exact axe targets, as reported for the node (same at both widths). */
  targets: string[];
  reason: string;
  phase: string;
};

// Known exceptions. Each listed target must still occur on every covered
// viewport of its route and theme, otherwise the last test fails.
const SEPIA_LINK = "Sepia accent link text (#6b7c2e) is 3.92:1 on #f5ecd7 (needs 4.5:1).";
const DARK_NOTE = "Muted note (stone-500 #79716b) is 3.94:1 on #111111 (needs 4.5:1).";
const PHASE_2 = "Phase 2: tokens";

const ALLOWLIST: AllowEntry[] = [
  {
    rule: "color-contrast",
    route: "/harfovi",
    theme: "sepia",
    targets: [
      String.raw`a[target="_blank"]`,
      String.raw`.mt-3.max-w-\[65ch\]:nth-child(10) > .text-\[var\(--theme-accent\)\].underline.hover\:no-underline`,
    ],
    reason: SEPIA_LINK,
    phase: PHASE_2,
  },
  ...["/about", "/contact"].map(
    (route): AllowEntry => ({
      rule: "color-contrast",
      route,
      theme: "sepia",
      targets: [".underline", String.raw`.hover\:underline`],
      reason: SEPIA_LINK,
      phase: PHASE_2,
    }),
  ),
  {
    rule: "color-contrast",
    route: "/sources",
    theme: "sepia",
    targets: [
      `section:nth-child(1) > .mt-1 > a[href$="quran.com"][target="_blank"][rel="noopener noreferrer"]`,
      `.mt-2.leading-relaxed > .underline[target="_blank"][rel="noopener noreferrer"]:nth-child(1)`,
      `.underline[target="_blank"][rel="noopener noreferrer"]:nth-child(2)`,
      `a[href$="tanzil.net"]`,
      `a[href$="harfovi"]`,
      `section:nth-child(3) > .mt-1 > .underline[target="_blank"][rel="noopener noreferrer"]`,
      `section:nth-child(4) > .mt-1 > a[href$="quran.com"][target="_blank"][rel="noopener noreferrer"]`,
      `a[href$="everyayah.com"]`,
      String.raw`.hover\:underline`,
    ],
    reason: SEPIA_LINK,
    phase: PHASE_2,
  },
  {
    rule: "color-contrast",
    route: "/about",
    theme: "dark",
    targets: [".italic"],
    reason: DARK_NOTE,
    phase: PHASE_2,
  },
  {
    rule: "color-contrast",
    route: "/sources",
    theme: "dark",
    targets: [".italic"],
    reason: DARK_NOTE,
    phase: PHASE_2,
  },
  {
    rule: "color-contrast",
    route: "/contact",
    theme: "dark",
    targets: [String.raw`.dark\:text-stone-500`],
    reason: DARK_NOTE,
    phase: PHASE_2,
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
/** "route|theme|viewport" combinations that were analysed in this run. */
const covered = new Set<string>();

function isAllowed(f: Finding): boolean {
  return ALLOWLIST.some(
    (e) =>
      e.rule === f.rule && e.route === f.route && e.theme === f.theme && e.targets.includes(f.target),
  );
}

function format(f: Finding): string {
  return `  ${f.route} [${f.theme}, ${f.viewport}px] ${f.rule}: ${f.target}\n    ${f.summary}`;
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
          covered.add(`${route}|${theme}|${vp.name}`);
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
    const unlisted = findings.filter((f) => f.route === route && !isAllowed(f));
    const report = `${unlisted.length} unlisted violation(s) on ${route}:\n${unlisted.map(format).join("\n")}`;
    expect(unlisted.length, report).toBe(0);
  });
}

test("every allowlisted target still occurs", () => {
  const stale: string[] = [];
  for (const e of ALLOWLIST) {
    for (const vp of VIEWPORTS) {
      if (!covered.has(`${e.route}|${e.theme}|${vp.name}`)) continue;
      for (const target of e.targets) {
        const hit = findings.some(
          (f) =>
            f.rule === e.rule &&
            f.route === e.route &&
            f.theme === e.theme &&
            f.viewport === vp.name &&
            f.target === target,
        );
        if (!hit) stale.push(`  ${e.rule} ${e.route} [${e.theme}, ${vp.name}px] ${target} (${e.phase})`);
      }
    }
  }
  const report = `${stale.length} allowlisted target(s) no longer occur (remove them):\n${stale.join("\n")}`;
  expect(stale.length, report).toBe(0);
});
