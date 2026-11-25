/**
 * One selected style (Phase 4, D2). The markup of a chosen or pressed control (aria-pressed,
 * native radios, role="switch") and the accent wash live in the shared components of
 * src/components/ui; a screen that draws its own version brings back the seven looks the app had.
 *
 * ALLOWED: files that use one of these for something that is not a choice, with the reason.
 * LEGACY: screens not rebuilt yet. An entry is removed when its screen is; an entry that no
 * longer has a hit fails the test, so the list can only shrink.
 */
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

const MARKERS = /aria-pressed|type="radio"|role="switch"|bg-accent-wash/;

const SHARED = [
  "components/ui/selected.ts",
  "components/ui/ChoiceGroup.tsx",
  "components/ui/FilterChip.tsx",
  "components/ui/Switch.tsx",
];

const ALLOWED: Record<string, string> = {
  "components/test/TestOption.tsx": "unrouted test mode, outside Phase 4",
  "components/test/TestQuestion.tsx": "unrouted test mode, outside Phase 4",
  "components/test/TestResult.tsx": "unrouted test mode, outside Phase 4",
  "components/pwa/InstallPrompt.tsx": "icon tile on the accent wash, not a choice",
  "components/tajwid/LessonSections.tsx": "note box on the accent wash, not a choice",
  "components/settings/SettingsPanel.tsx": "the all-downloaded note on the accent wash, not a choice",
};

const LEGACY = [
  "app/page.tsx",
  "components/bookmarks/BookmarksContent.tsx",
  "components/home/FeaturedSurahsSection.tsx",
  "components/learn/LearnModeContent.tsx",
  "components/progress/ProgressContent.tsx",
  "components/surahs/SurahListItem.tsx",
  "components/surahs/SurahsPageContent.tsx",
  "components/tajwid/TajwidQuiz.tsx",
];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "__tests__" ? [] : sourceFiles(full);
    return /\.tsx?$/.test(e.name) ? [full] : [];
  });
}

const withMarkers = sourceFiles(SRC)
  .filter((file) => MARKERS.test(readFileSync(file, "utf-8")))
  .map((file) => path.relative(SRC, file).split(path.sep).join("/"));

describe("one selected style", () => {
  it("keeps the selected markup inside the shared components", () => {
    const known = new Set([...SHARED, ...Object.keys(ALLOWED), ...LEGACY]);
    expect(withMarkers.filter((file) => !known.has(file))).toEqual([]);
  });

  it("has no stale entry: every listed file still has a hit", () => {
    const hits = new Set(withMarkers);
    const stale = [...SHARED, ...Object.keys(ALLOWED), ...LEGACY].filter((file) => !hits.has(file));
    expect(stale).toEqual([]);
  });
});
