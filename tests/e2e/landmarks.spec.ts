import { test, expect } from "@playwright/test";

// AppShell wraps every route in <main>. A page that renders its own <main> nests a second
// main landmark inside it: invalid HTML, and screen readers announce two main regions.
const ROUTES = [
  "/",
  "/surahs",
  "/surah/1",
  "/learn/1",
  "/search",
  "/duas",
  "/duas/rabbana",
  "/names",
  "/juz/1",
  "/bookmarks",
];

test.describe("Page landmarks", () => {
  for (const route of ROUTES) {
    test(`${route} has exactly one main landmark`, async ({ page }) => {
      await page.goto(route);
      await expect(page.getByRole("main")).toHaveCount(1);
    });
  }
});
