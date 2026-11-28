/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { getAyahsForJuz } from "@/lib/data";
import JuzPage from "../page";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));
// The juz navigation is rendered; the ayah cards are not under test here.
vi.mock("@/components/reader/AyahUnit", () => ({ AyahUnit: () => null }));

afterEach(cleanup);

describe("Juz page", () => {
  it("counts ayahs and surahs with the right plural forms", async () => {
    const segments = await getAyahsForJuz(1);
    const ayahCount = segments.reduce((acc, s) => acc + s.ayahs.length, 0);
    expect(ayahCount).toBe(148);
    render(await JuzPage({ params: Promise.resolve({ juzId: "1" }) }));
    expect(screen.getByText("148 ajeta · 2 sure")).toBeInTheDocument();
  });

  it("links back to all juzes without an arrow", async () => {
    render(await JuzPage({ params: Promise.resolve({ juzId: "1" }) }));
    const link = screen.getByRole("link", { name: "Svi džuzevi" });
    expect(link).toHaveAttribute("href", "/surahs?view=juz");
    expect(link.textContent).toBe("Svi džuzevi");
  });

  // R11: without a previous or next juz the navigation keeps its slot empty instead of a
  // second link to the overview under another name.
  it.each([
    ["1", 0],
    ["30", 1],
  ])("/juz/%s has exactly one link to the juz overview, named Svi džuzevi", async (juzId, emptySlot) => {
    render(await JuzPage({ params: Promise.resolve({ juzId }) }));
    const overview = screen.getAllByRole("link").filter((a) => a.getAttribute("href") === "/surahs?view=juz");
    expect(overview).toHaveLength(1);
    expect(overview[0]).toHaveAccessibleName("Svi džuzevi");
    const nav = screen.getByRole("navigation", { name: "Susjedni džuzevi" });
    const cards = nav.querySelector(".grid")!;
    expect(cards.children).toHaveLength(2);
    expect(cards.children[emptySlot]).toBeEmptyDOMElement();
  });

  it("leads to the neighbouring juz at the end, by name", async () => {
    render(await JuzPage({ params: Promise.resolve({ juzId: "2" }) }));
    expect(screen.getByRole("link", { name: "Prethodni džuz Džuz 1" })).toHaveAttribute("href", "/juz/1");
    expect(screen.getByRole("link", { name: "Sljedeći džuz Džuz 3" })).toHaveAttribute("href", "/juz/3");
  });

  it("has one h1 and no card around the title", async () => {
    const { container } = render(await JuzPage({ params: Promise.resolve({ juzId: "1" }) }));
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(container.querySelector("header")?.className ?? "").not.toMatch(/rounded-2xl|bg-highlight/);
    expect((container.firstElementChild as HTMLElement).className).not.toMatch(/\bp[xy]?-\d/);
  });
});
