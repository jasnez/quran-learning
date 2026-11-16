/**
 * The UI is in Bosnian, so the document language must be Bosnian. Screen
 * readers pick pronunciation from <html lang>, and browsers use it for
 * hyphenation and translation prompts. Arabic blocks set lang="ar" locally.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const layoutPath = path.join(__dirname, "../layout.tsx");

describe("root layout document language", () => {
  it('sets <html lang="bs">', () => {
    const layout = readFileSync(layoutPath, "utf-8");
    expect(layout).toMatch(/<html\s+lang="bs"/);
  });
});
