import { defineConfig, devices } from "@playwright/test";

// Axe regression run: its own port and a fresh dev server, so a different app
// that happens to listen on 3000 can never be tested by accident.
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "a11y.spec.ts",
  // One worker: the spec collects findings in module state and checks the
  // allowlist for stale entries in a final test.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3210",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npx next dev --webpack -p 3210",
    url: "http://localhost:3210",
    reuseExistingServer: false,
    timeout: 180000,
  },
});
