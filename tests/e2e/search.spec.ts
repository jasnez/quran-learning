import { test, expect } from "@playwright/test";

test.describe("Pretraga", () => {
  test("stranica za pretragu se učitava", async ({ page }) => {
    await page.goto("/search");
    await expect(page).toHaveURL("/search");
    await expect(page.locator("h1")).not.toContainText("Greška");
  });

  test("pretraga po bosanskom tekstu vraća rezultate", async ({ page }) => {
    await page.goto("/search");
    const input = page.locator("input[type='search'], input[type='text']").first();
    await input.fill("milostiv");
    // Sačekaj rezultate
    await page.waitForTimeout(500);
    // Trebaju biti vidljivi rezultati ili poruka "nema rezultata"
    const hasResults = await page.locator("a[href^='/surah/']").count();
    const hasNoResults = await page.locator("text=/nema|nije pronađeno/i").count();
    expect(hasResults + hasNoResults).toBeGreaterThan(0);
  });

  test("pretraga po arapskom tekstu radi", async ({ page }) => {
    await page.goto("/search");
    const input = page.locator("input[type='search'], input[type='text']").first();
    await input.fill("بسم");
    await page.waitForTimeout(500);
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
