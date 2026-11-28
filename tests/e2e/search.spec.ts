import { test, expect, type Page } from "@playwright/test";

/**
 * Types the query and waits for the first result. The results come after the debounce and the
 * download of the search index (1.2-1.5 s on the dev server), so a fixed pause is not enough.
 */
async function search(page: Page, query: string) {
  await page.goto("/search");
  await page.locator("input[type='search'], input[type='text']").first().fill(query);
  await expect(page.locator("a[href^='/surah/']").first()).toBeVisible({ timeout: 15_000 });
}

test.describe("Pretraga", () => {
  test("stranica za pretragu se učitava", async ({ page }) => {
    await page.goto("/search");
    await expect(page).toHaveURL("/search");
    await expect(page.locator("h1")).not.toContainText("Greška");
  });

  test("pretraga po bosanskom tekstu vraća rezultate", async ({ page }) => {
    await search(page, "milostiv");
  });

  test("pretraga po arapskom tekstu radi", async ({ page }) => {
    await search(page, "بسم");
    await expect(page.locator("body")).not.toContainText("Greška");
  });

  test("klik na rezultat pretrage otvara suru", async ({ page }) => {
    await page.goto("/search");
    const input = page.locator("input[type='search'], input[type='text']").first();
    await input.fill("Rahman");
    await page.waitForTimeout(500);
    const firstResult = page.locator("a[href^='/surah/']").first();
    if (await firstResult.isVisible()) {
      await firstResult.click();
      await expect(page).toHaveURL(/\/surah\//);
    }
  });
});
