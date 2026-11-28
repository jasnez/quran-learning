import { test, expect, type Page } from "@playwright/test";

/**
 * Phase 4: reading comes before controls. On main before it, the first ayah of a surah started at
 * 844 px on a 375 x 812 phone and at 782 px on a 1280 x 800 desktop, below or at the edge of the
 * first screen. These tests hold the first ayah on the first screen and settings to one entry.
 */

const SIZES = [
  { name: "phone", width: 375, height: 812 },
  { name: "desktop", width: 1280, height: 800 },
] as const;

const SURAHS = [1, 36, 112];
const HEADER_HEIGHT = 48;

/** Progress as the app stores it: one heard and one read ayah of the surah. */
function seedProgress(surahNumber: number) {
  return {
    state: {
      lastSurahNumber: surahNumber,
      lastAyahNumber: 2,
      lastSurahNameLatin: "",
      lastMode: "reader",
      timestamp: "2026-11-25T10:00:00.000Z",
      totalListeningTimeMs: 6000,
      surahsVisited: [surahNumber],
      ayahsListened: 1,
      surahProgressMap: {
        [surahNumber]: {
          surahNumber,
          totalAyahs: 0,
          ayahsListened: [1],
          ayahsRead: [2],
          completionPercent: 0,
          lastAccessedAt: "2026-11-25T10:00:00.000Z",
          timeSpentMs: 6000,
        },
      },
      tajwidLessonProgress: {},
      testResults: [],
    },
    version: 0,
  };
}

/** Where the first screen ends for content: the tab bar on a phone, the window on a desktop. */
async function firstScreenBottom(page: Page, size: (typeof SIZES)[number]): Promise<number> {
  if (size.name === "desktop") return size.height;
  const tabBar = await page.getByRole("navigation", { name: "Mobilna navigacija" }).boundingBox();
  expect(tabBar).not.toBeNull();
  return tabBar!.y;
}

async function expectFirstAyahOnFirstScreen(page: Page, size: (typeof SIZES)[number]) {
  const first = page.locator("[data-ayah-id]").first();
  await expect(first).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const box = await first.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y).toBeGreaterThanOrEqual(HEADER_HEIGHT);
  expect(box!.y + box!.height).toBeLessThanOrEqual(await firstScreenBottom(page, size));
}

for (const size of SIZES) {
  test.describe(`čitač na ${size.width} x ${size.height}`, () => {
    test.use({ viewport: { width: size.width, height: size.height } });

    for (const surah of SURAHS) {
      test(`prvi ajet sure ${surah} je cijeli na prvom ekranu`, async ({ page }) => {
        await page.goto(`/surah/${surah}`);
        await expectFirstAyahOnFirstScreen(page, size);
      });

      test(`prvi ajet sure ${surah} ostaje na prvom ekranu i uz red o napretku`, async ({ page }) => {
        await page.addInitScript(
          ([key, value]) => window.localStorage.setItem(key, value),
          ["quran-learning-progress", JSON.stringify(seedProgress(surah))] as const,
        );
        await page.goto(`/surah/${surah}`);
        await expect(page.getByText(/^Pročitano: 2 od \d+ ajeta$/)).toBeVisible();
        await expectFirstAyahOnFirstScreen(page, size);
      });
    }

    test("iznad prvog ajeta nema linka na drugu suru", async ({ page }) => {
      await page.goto("/surah/36");
      const firstAyahTop = (await page.locator("[data-ayah-id]").first().boundingBox())!.y;
      const links = await page.locator("main a[href^='/surah/']").all();
      for (const link of links) {
        const box = await link.boundingBox();
        if (box) expect(box.y).toBeGreaterThan(firstAyahTop);
      }
    });

    test("na stranici sure je tačno jedan ulaz u postavke", async ({ page }) => {
      await page.goto("/surah/112");
      await expect(page.locator("[data-ayah-id]").first()).toBeVisible();
      const entries = await page
        .getByRole("button", { name: /Postavke/ })
        .or(page.getByRole("link", { name: /Postavke/ }))
        .all();
      const visible = await Promise.all(entries.map((entry) => entry.isVisible()));
      expect(visible.filter(Boolean)).toHaveLength(1);
      await expect(page.getByRole("button", { name: "Postavke čitanja" })).toBeVisible();
    });

    test("zaglavlje kaže koja je sura i koji je ajet na ekranu", async ({ page }) => {
      await page.goto("/surah/112");
      const banner = page.getByRole("banner");
      await expect(banner.locator("[data-reader-title]")).toBeVisible();
      await expect(banner.locator("[data-reader-count]")).toContainText("1/4");
    });
  });
}

test("nepostojeća sura daje stranicu 404 bez greške pri hidrataciji", async ({ page }) => {
  const problems: string[] = [];
  page.on("pageerror", (error) => problems.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && /hydrat|did not match|#418/i.test(message.text())) problems.push(message.text());
  });
  await page.goto("/surah/115");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Ova stranica ne postoji");
  await expect(page.getByRole("banner").locator("[data-reader-title]")).toHaveCount(0);
  expect(problems).toEqual([]);
});
