/**
 * @vitest-environment node
 */
// Regression tests for QA P1-6: the static export must contain the page
// content, not only a skeleton. During `next build`, useSearchParams() throws
// a "bail out to client-side rendering" error that the nearest <Suspense>
// catches; everything inside that boundary is left out of the HTML. The mock
// below reproduces that, so a useSearchParams call wrapping the content fails
// these tests. (`next dev` renders search params on the server, so e2e tests
// against the dev server cannot catch this.)
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import SurahReaderPage from "../surah/[surahId]/page";
import SurahsPage from "../surahs/page";
import fatiha from "@/data/ayahs/001-al-fatiha.json";

vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  useSearchParams: () => {
    throw new Error("Bail out to client-side rendering: useSearchParams()");
  },
}));

/** Renders like the static export: errors inside a Suspense boundary become its fallback. */
function prerender(ui: React.ReactNode): string {
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    return renderToString(ui);
  } finally {
    consoleError.mockRestore();
  }
}

describe("static HTML of /surah/[id] (P1-6)", () => {
  it("contains the surah title and the Arabic text of every ayah", async () => {
    const html = prerender(await SurahReaderPage({ params: Promise.resolve({ surahId: "1" }) }));
    // SurahFrame: Arabic name in the h1, Latin and Bosnian names below it.
    expect(html).toMatch(new RegExp(`<h1[^>]*>${fatiha.surah.nameArabic}</h1>`));
    expect(html).toContain(fatiha.surah.nameLatin);
    for (const ayah of fatiha.ayahs) {
      expect(html).toContain(`data-ayah-id="${ayah.id}"`);
      // Tajwid colouring splits the text into spans; every segment must be there.
      for (const segment of ayah.tajwidSegments) {
        expect(html).toContain(segment.text);
      }
    }
  });
});

describe("static HTML of /surahs (P1-6)", () => {
  it("contains the surah list", async () => {
    const html = prerender(await SurahsPage());
    expect(html).toContain('aria-label="Sve sure"');
    expect(html).toContain("El-Beqare");
    expect(html).toContain('href="/surah/114"');
  });
});
