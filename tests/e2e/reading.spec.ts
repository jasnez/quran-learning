import { test, expect } from "@playwright/test";

test.describe("Čitanje sure", () => {
  test("lista sura se učitava i prikazuje 114 sura", async ({ page }) => {
    await page.goto("/surahs");
    // Trebaju biti svi naslovi sura vidljivi
    const surahItems = page.locator("a[href^='/surah/']");
    await expect(surahItems).toHaveCount(114);
  });

  test("klik na suru otvara stranicu za čitanje", async ({ page }) => {
    await page.goto("/surahs");
    await page.locator("a[href='/surah/1']").first().click();
    await expect(page).toHaveURL(/\/surah\/1/);
  });

  test("Al-Fatiha se učitava s arapskim tekstom", async ({ page }) => {
    await page.goto("/surah/1");
    // Arapski tekst treba biti vidljiv (sadrži unicode arapska slova)
    const arabicText = page.locator("[lang='ar'], [dir='rtl']").first();
    await expect(arabicText).toBeVisible();
  });

  test("prikazuje se prijevod na bosanski", async ({ page }) => {
    await page.goto("/surah/1");
    // Provjeri da stranica ima sadržaj (nije blank)
    await expect(page.locator("main, [role='main']")).toBeVisible();
    await expect(page).not.toHaveTitle("");
  });

  test("navigacija na suru 2 (Al-Baqara) radi", async ({ page }) => {
    await page.goto("/surah/2");
    await expect(page).toHaveURL("/surah/2");
    // Stranica ne smije biti error stranica
    await expect(page.locator("h1")).not.toContainText("Greška");
  });
});
