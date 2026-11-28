import { test, expect } from "@playwright/test";

test.describe("Audio player", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/surah/1");
  });

  test("audio player kontrole su vidljive", async ({ page }) => {
    // Play controls are labelled in Bosnian ("Pusti suru", "Pusti 1. ajet").
    const player = page.getByRole("button", { name: /^pusti/i }).first();
    await expect(player).toBeVisible({ timeout: 5000 });
  });

  test("dugme za play/pause postoji i reaguje na klik", async ({ page }) => {
    await page.getByRole("button", { name: "Pusti suru" }).click();
    // While audio plays, the play controls switch to "Pauziraj".
    await expect(page.getByRole("button", { name: /^Pauziraj/ }).first()).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Greška");
  });

  test("stranica postavki se učitava i prikazuje učača", async ({ page }) => {
    // /settings renders the settings panel; the reciter is in its "Zvuk" section.
    await page.goto("/settings");
    await expect(page).toHaveURL("/settings");
    const settings = page.getByRole("dialog", { name: "Postavke" });
    await expect(settings).toBeVisible();
    await expect(settings.getByRole("region", { name: "Zvuk" })).toContainText("Mishary Alafasy");
  });
});
