import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    env: { NODE_ENV: "test" },
    // The default (all cores but one) ran 11 jsdom workers on a 16 GB machine; free
    // memory fell to about 500 MB, the system paged, and tests that take 1-2s alone
    // took 5-20s. Half the cores keeps the full run as fast and stops the paging.
    maxWorkers: "50%",
    // Headroom for load from other programs; Node on Windows ARM64 may run as x64
    // under emulation, which makes every test slower.
    testTimeout: 15000,
    // .claude/ holds Claude Code session worktrees (full copies of the repo).
    exclude: ["**/node_modules/**", "**/tests/e2e/**", ".claude/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
