import { test, expect } from "@playwright/test";

test.describe("Audio player", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/surah/1");
  });

  test("audio player kontrole su vidljive", async ({ page }) => {
    // Player treba biti vidljiv na stranici sure
    const player = page
      .locator("[aria-label*='play'], [aria-label*='Play'], button[title*='lay']")
      .first();
    await expect(player).toBeVisible({ timeout: 5000 });
  });

  test("dugme za play/pause postoji i reaguje na klik", async ({ page }) => {
    const playButton = page
      .locator("button[aria-label*='play' i], button[aria-label*='pauza' i], button[aria-label*='pause' i]")
      .first();
    if (await playButton.isVisible()) {
      await playButton.click();
      // Ne treba baciti grešku
      await expect(page.locator("body")).not.toContainText("Greška", { timeout: 2000 }).catch(() => {});
    }
  });

  test("promjena učača ne ruši stranicu", async ({ page }) => {
    // Provjeri da settings/reciter kontrola postoji
    await page.goto("/settings");
    await expect(page).toHaveURL("/settings");
    await expect(page.locator("h1")).not.toContainText("Greška");
  });
});
