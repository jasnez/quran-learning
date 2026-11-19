import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("web app manifest", () => {
  const manifest = JSON.parse(
    readFileSync(join(process.cwd(), "public", "manifest.webmanifest"), "utf8"),
  ) as Record<string, unknown>;

  // WCAG 1.3.4: the app must not lock the screen to one orientation.
  it("does not lock the orientation", () => {
    expect(manifest).not.toHaveProperty("orientation");
  });
});
