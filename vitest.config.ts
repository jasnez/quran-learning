import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    env: { NODE_ENV: "test" },
    // .claude/ holds Claude Code session worktrees (full copies of the repo).
    exclude: ["**/node_modules/**", "**/tests/e2e/**", ".claude/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
