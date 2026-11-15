/**
 * @vitest-environment jsdom
 *
 * QA P1-3: sticky elements must stick below the fixed global header
 * (Header.tsx: fixed, h-12, z-50). jsdom has no layout, so these tests guard
 * the class contract; the real sticking is verified in a browser.
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { SurahAyahNav } from "@/components/reader/SurahAyahNav";
import { SurahReaderStickyHeader } from "@/components/reader/SurahReaderStickyHeader";
import { ReaderToolbar } from "@/components/reader/ReaderToolbar";
import { SearchInput } from "@/components/surahs/SearchInput";
import type { Ayah } from "@/types/quran";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

afterEach(() => cleanup());

/** Follows the global header: 3rem while shown, 0 while it slides away. */
const HEADER_OFFSET = "top-[var(--app-header-offset)]";

const globalsCss = readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), "../../../app/globals.css"),
  "utf-8"
);

const ayahs = [{ id: "1:1" }, { id: "1:2" }] as unknown as Ayah[];

function classes(el: Element | null): string[] {
  return (el?.getAttribute("class") ?? "").split(/\s+/);
}

describe("sticky offsets below the fixed global header (QA P1-3)", () => {
  it("globals.css sets the header offset to the header height (h-12 = 3rem) and to 0 while the header is hidden", () => {
    expect(globalsCss).toMatch(/:root\s*\{[^}]*--app-header-offset:\s*3rem/);
    expect(globalsCss).toMatch(
      /\[data-scroll-container\]:has\(>\s*header\[data-hidden="true"\]\)\s*\{[^}]*--app-header-offset:\s*0(px)?\s*;/
    );
  });

  it("desktop ayah TOC: the aside itself is sticky (its parent uses items-start, so a sticky child of the aside could never move)", () => {
    const { container } = render(<SurahAyahNav ayahs={ayahs} surahNumber={1} />);
    const aside = container.querySelector("aside");
    expect(classes(aside)).toContain("lg:sticky");
    expect(classes(aside)).toContain("lg:top-[calc(var(--app-header-offset)+1rem)]");
    expect(classes(aside)).toContain("lg:overflow-y-auto");
    expect(aside?.querySelector(".lg\:sticky")).toBeNull();
  });

  it("surah reader header sticks right below the global header, not under it", () => {
    const { getByTestId } = render(
      <SurahReaderStickyHeader
        surahNameLatin="Al-Fatiha"
        surahNumberArabic="الفاتحة"
        totalAyahs={7}
        ayahs={ayahs}
      />
    );
    const c = classes(getByTestId("surah-reader-sticky-header"));
    expect(c).toContain("sticky");
    expect(c).toContain(HEADER_OFFSET);
    expect(c).not.toContain("top-0");
    // Desktop shows the sticky toolbar at the same offset instead.
    expect(c).toContain("lg:static");
  });

  it("desktop reader toolbar sticks right below the global header", () => {
    const { getByRole } = render(<ReaderToolbar />);
    const c = classes(getByRole("toolbar", { hidden: true }));
    expect(c).toContain("sticky");
    expect(c).toContain(HEADER_OFFSET);
  });

  it("mobile surah list search sticks below the global header", () => {
    const { container } = render(<SearchInput value="" onChange={() => {}} />);
    const c = classes(container.firstElementChild);
    expect(c).toContain("sticky");
    expect(c).toContain(HEADER_OFFSET);
    expect(c).not.toContain("top-0");
  });
});
