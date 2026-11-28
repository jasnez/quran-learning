/**
 * Bar heights, layers and motion are tokens in globals.css (Phase 4, D1): nothing positions
 * itself with its own number. The scan at the end fails on a raw z-index class anywhere in src.
 */
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, "../..");
const CSS = readFileSync(path.join(HERE, "../globals.css"), "utf-8").replace(/\/\*[\s\S]*?\*\//g, "");

/** Every declared value of a custom property, in source order. */
function values(name: string): string[] {
  const escaped = name.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
  return [...CSS.matchAll(new RegExp(`${escaped}\\s*:\\s*([^;]+);`, "g"))].map((m) => m[1].trim());
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "__tests__" ? [] : sourceFiles(full);
    return /\.tsx?$/.test(e.name) ? [full] : [];
  });
}

describe("layout tokens", () => {
  it.each([
    ["--bar-header", "3rem"],
    ["--bar-nav", "3.5rem"],
    ["--bar-player", "4rem"],
    ["--z-sticky", "10"],
    ["--z-float", "30"],
    ["--z-bars", "40"],
    ["--z-player", "41"],
    ["--z-infobar", "45"],
    ["--z-toast", "50"],
    ["--z-skip", "60"],
    ["--duration-press", "150ms"],
    ["--duration-sheet", "200ms"],
    ["--ease-standard", "cubic-bezier(0.2, 0, 0, 1)"],
  ])("%s is %s", (name, value) => {
    expect(values(name)).toEqual([value]);
  });

  it("counts the tab bar only under 48rem and the player only while it is in the page", () => {
    expect(values("--bar-nav-now")).toEqual(["0px", "var(--bar-nav)"]);
    expect(CSS).toMatch(/@media \(width < 48rem\)\s*\{\s*:root\s*\{[^}]*--bar-nav-now:\s*var\(--bar-nav\)/);
    expect(values("--bar-player-now")).toEqual(["0px", "var(--bar-player)", "var(--bar-player)"]);
    expect(CSS).toMatch(/:root:has\(\[data-audio-player\]\)\s*\{[^}]*--bar-player-now:\s*var\(--bar-player\)/);
  });

  it("adds the bottom bars up in one variable", () => {
    expect(values("--bars-bottom")).toEqual([
      "calc(var(--bar-nav-now) + var(--bar-player-now) + env(safe-area-inset-bottom, 0px))",
    ]);
  });

  // Without :has() the root cannot see the player, so the player also sets an attribute on the
  // root (AudioPlayer.test.tsx). A rule of its own: in a selector list the unknown :has() would
  // drop the whole rule.
  it("counts the player from the root's attribute too, for browsers without :has()", () => {
    expect(CSS).toMatch(/(?:^|\})\s*:root\[data-has-audio\]\s*\{\s*--bar-player-now:\s*var\(--bar-player\);\s*\}/);
  });

  it("keeps scrolled-to and focused elements clear of the bottom bars with one rule", () => {
    expect(values("scroll-padding-bottom")).toEqual(["calc(var(--bars-bottom) + 6rem)"]);
  });

  it("derives the sticky offset under the header from the header height", () => {
    expect(values("--app-header-offset")).toEqual(["var(--bar-header)", "0px"]);
  });

  it.each(["z-sticky", "z-float", "z-bars", "z-player", "z-infobar", "z-toast", "z-skip"])(
    "has the utility %s",
    (utility) => {
      const token = `--${utility}`;
      expect(CSS).toMatch(new RegExp(`@utility ${utility}\\s*\\{\\s*z-index:\\s*var\\(${token}\\);\\s*\\}`));
    },
  );

  it.each([
    ["duration-press", "--duration-press"],
    ["duration-sheet", "--duration-sheet"],
  ])("has the utility %s", (utility, token) => {
    expect(CSS).toMatch(
      new RegExp(`@utility ${utility}\\s*\\{\\s*transition-duration:\\s*var\\(${token}\\);\\s*\\}`),
    );
  });
});

describe("layers in components", () => {
  it("uses only the z-index token utilities", () => {
    // z-10, z-[45], lg:z-50 ...; the token utilities (z-bars, z-toast, ...) have no digit or bracket.
    const raw = /(?:^|[\s"'`:])z-(?:\d+|\[[^\]]+\])/g;
    const hits = sourceFiles(SRC).flatMap((file) => {
      const found = readFileSync(file, "utf-8").match(raw) ?? [];
      return found.map((m) => `${path.relative(SRC, file)}: ${m.trim()}`);
    });
    expect(hits).toEqual([]);
  });
});
