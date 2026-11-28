/**
 * @vitest-environment jsdom
 *
 * On a reading screen the global header says where you are (Phase 4, D3): back, the surah name,
 * the ayah on screen, and the one way into reading settings. No second bar under it.
 */
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, within } from "@testing-library/react";
import surahsData from "@/data/surahs.json";
import type { SurahSummary } from "@/types/quran";
import { SettingsOpenProvider } from "@/contexts/SettingsOpenContext";
import { useReaderPositionStore } from "@/store/readerPositionStore";
import { Header } from "../Header";

const route = vi.hoisted(() => ({
  pathname: "/",
  segment: null as string | null,
  params: {} as Record<string, string>,
}));

vi.mock("next/navigation", async (orig) => ({
  ...((await orig()) as Record<string, unknown>),
  usePathname: () => route.pathname,
  useSelectedLayoutSegment: () => route.segment,
  useParams: () => route.params,
}));

const surahs = surahsData as SurahSummary[];
const ihlas = surahs.find((s) => s.surahNumber === 112)!;
const beqare = surahs.find((s) => s.surahNumber === 2)!;

function renderHeader(segment: string | null, params: Record<string, string>, pathname: string) {
  route.segment = segment;
  route.params = params;
  route.pathname = pathname;
  return render(
    <SettingsOpenProvider>
      <Header />
    </SettingsOpenProvider>,
  );
}

afterEach(() => {
  cleanup();
  useReaderPositionStore.setState({ ayahNumber: 1 });
});

describe("Header on a surah page", () => {
  it("names the surah, with the Arabic name marked as Arabic", () => {
    renderHeader("surah", { surahId: "112" }, "/surah/112");
    const banner = screen.getByRole("banner");
    const title = within(banner).getByText(ihlas.nameLatin);
    expect(title.closest("[data-reader-title]")).toHaveClass("truncate");
    expect(banner.querySelector('[data-reader-title] [lang="ar"]')).toHaveTextContent(ihlas.nameArabic);
  });

  it("leads back to all surahs", () => {
    renderHeader("surah", { surahId: "112" }, "/surah/112");
    expect(screen.getByRole("link", { name: "Nazad na sve sure" })).toHaveAttribute("href", "/surahs");
  });

  it("counts the ayah on screen, in digits for the eye and in words for screen readers", () => {
    renderHeader("surah", { surahId: "112" }, "/surah/112");
    const counter = screen.getByRole("banner").querySelector("[data-reader-count]")!;
    expect(counter).toHaveClass("shrink-0", "tabular-nums");
    expect(within(counter as HTMLElement).getByText("1/4")).toHaveAttribute("aria-hidden", "true");
    expect(within(counter as HTMLElement).getByText("1. ajet od 4")).toHaveClass("sr-only");
    act(() => useReaderPositionStore.getState().setAyahNumber(3));
    expect(within(counter as HTMLElement).getByText("3/4")).toBeInTheDocument();
  });

  it("fits the longest count: the name gives way, the count does not", () => {
    renderHeader("surah", { surahId: "2" }, "/surah/2");
    act(() => useReaderPositionStore.getState().setAyahNumber(286));
    const banner = screen.getByRole("banner");
    expect(within(banner).getByText("286/286")).toBeInTheDocument();
    expect(within(banner).getByText(beqare.nameLatin).closest("[data-reader-title]")).toHaveClass("min-w-0", "truncate");
  });

  it("has exactly one way into settings, named for reading", () => {
    renderHeader("surah", { surahId: "112" }, "/surah/112");
    expect(screen.getAllByRole("button", { name: /Postavke/ })).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Postavke čitanja" })).not.toHaveClass("hidden");
  });

  it("on a phone gives the brand's and the search's place to the surah name and settings", () => {
    renderHeader("surah", { surahId: "112" }, "/surah/112");
    expect(screen.getByRole("link", { name: /početna/ })).toHaveClass("hidden", "sm:block");
    expect(screen.getByRole("link", { name: "Pretraga" })).toHaveClass("hidden", "sm:flex");
  });
});

describe("Header on a juz page", () => {
  it("names the juz, leads back to the juz list and shows no count", () => {
    renderHeader("juz", { juzId: "30" }, "/juz/30");
    const banner = screen.getByRole("banner");
    expect(within(banner).getByText("Džuz 30")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Nazad na sve džuzeve" })).toHaveAttribute("href", "/surahs?view=juz");
    expect(banner.querySelector("[data-reader-count]")).toBeNull();
  });
});

describe("Header everywhere else", () => {
  it("is the brand header: brand and search on a phone, settings from 640 px", () => {
    renderHeader("surahs", {}, "/surahs");
    const banner = screen.getByRole("banner");
    expect(banner.querySelector("[data-reader-title]")).toBeNull();
    expect(screen.getByRole("link", { name: /početna/ })).not.toHaveClass("hidden");
    expect(screen.getByRole("link", { name: "Pretraga" })).not.toHaveClass("hidden");
    expect(screen.getByRole("button", { name: "Postavke" })).toHaveClass("hidden", "sm:flex");
  });

  it("stays the brand header on the 404 page served at an unknown surah URL", () => {
    renderHeader("/_not-found", { surahId: "115" }, "/surah/115");
    expect(screen.getByRole("banner").querySelector("[data-reader-title]")).toBeNull();
    expect(screen.queryByRole("link", { name: "Nazad na sve sure" })).toBeNull();
  });
});
