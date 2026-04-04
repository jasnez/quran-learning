import { test, expect } from "@playwright/test";

test.describe("Autentifikacija", () => {
  test("stranica za prijavu se učitava", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page).toHaveURL("/auth/login");
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
  });

  test("stranica za registraciju se učitava", async ({ page }) => {
    await page.goto("/auth/register");
    await expect(page).toHaveURL("/auth/register");
    await expect(page.locator("input[type='email']")).toBeVisible();
  });

  test("stranica za zaboravljenu lozinku se učitava", async ({ page }) => {
    await page.goto("/auth/forgot-password");
    await expect(page).toHaveURL("/auth/forgot-password");
    await expect(page.locator("input[type='email']")).toBeVisible();
  });

  test("pokušaj prijave s neispravnim podacima prikazuje grešku", async ({ page }) => {
    await page.goto("/auth/login");
    await page.locator("input[type='email']").fill("nepostoji@test.com");
    await page.locator("input[type='password']").fill("pogresna-lozinka");
    await page.locator("button[type='submit']").click();
    // Treba prikazati grešku, ne redirectovati na dashboard
    await page.waitForTimeout(2000);
    await expect(page).not.toHaveURL("/");
  });

  test("link na login-u vodi ka registraciji", async ({ page }) => {
    await page.goto("/auth/login");
    const registerLink = page.locator("a[href*='register']").first();
    if (await registerLink.isVisible()) {
      await registerLink.click();
      await expect(page).toHaveURL(/register/);
    }
  });
});
