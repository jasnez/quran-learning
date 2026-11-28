/**
 * @vitest-environment jsdom
 *
 * EndNav: where to go after the last ayah, lesson section or juz. Two quiet cards (previous on
 * the left, next on the right) and one link to the whole list. Never the strongest thing on the
 * page, and never above the content.
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, within, cleanup } from "@testing-library/react";
import { EndNav } from "@/components/ui";

vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

afterEach(cleanup);

const prev = { href: "/surah/111", kicker: "Prethodna sura", title: "El-Leheb" };
const next = { href: "/surah/113", kicker: "Sljedeća sura", title: "El-Feleq" };
const all = { href: "/surahs", label: "Sve sure" };

describe("EndNav", () => {
  it("is a navigation named by its label, with the previous, the next and the whole list", () => {
    render(<EndNav label="Susjedne sure" prev={prev} next={next} all={all} />);
    const nav = within(screen.getByRole("navigation", { name: "Susjedne sure" }));
    expect(nav.getByRole("link", { name: "Prethodna sura El-Leheb" })).toHaveAttribute("href", "/surah/111");
    expect(nav.getByRole("link", { name: "Sljedeća sura El-Feleq" })).toHaveAttribute("href", "/surah/113");
    expect(nav.getByRole("link", { name: "Sve sure" })).toHaveAttribute("href", "/surahs");
    expect(nav.getAllByRole("link")).toHaveLength(3);
  });

  it("puts the previous on the left and the next on the right, in two columns", () => {
    render(<EndNav label="Susjedne sure" prev={prev} next={next} all={all} />);
    const grid = screen.getByRole("link", { name: /Prethodna sura/ }).parentElement!;
    expect(grid).toHaveClass("grid", "grid-cols-2");
    expect(grid.children).toHaveLength(2);
    expect(grid.children[0]).toHaveTextContent("El-Leheb");
    expect(grid.children[1]).toHaveTextContent("El-Feleq");
    expect(grid.children[1]).toHaveClass("text-right");
  });

  it("keeps the next on the right when there is no previous (the first surah)", () => {
    render(<EndNav label="Susjedne sure" next={next} all={all} />);
    const grid = screen.getByRole("link", { name: /Sljedeća sura/ }).parentElement!;
    expect(grid.children).toHaveLength(2);
    expect(grid.children[0]).toBeEmptyDOMElement();
    expect(grid.children[0]).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("link", { name: /Prethodna/ })).toBeNull();
  });

  it("keeps the previous on the left when there is no next (the last surah)", () => {
    render(<EndNav label="Susjedne sure" prev={prev} all={all} />);
    const grid = screen.getByRole("link", { name: /Prethodna sura/ }).parentElement!;
    expect(grid.children).toHaveLength(2);
    expect(grid.children[1]).toBeEmptyDOMElement();
  });

  it("is quiet: bordered cards with a small label over the name, no filled button, no pill", () => {
    const { container } = render(<EndNav label="Susjedne sure" prev={prev} next={next} all={all} />);
    const card = screen.getByRole("link", { name: /Prethodna sura/ });
    expect(card).toHaveClass("border", "border-line", "rounded-control");
    expect(within(card).getByText("Prethodna sura")).toHaveClass("text-ink-muted");
    expect(container.innerHTML).not.toMatch(/bg-accent\b|rounded-full/);
  });

  it("names things in words, without arrows", () => {
    const { container } = render(<EndNav label="Susjedne sure" prev={prev} next={next} all={all} />);
    expect(container.textContent).not.toMatch(/[←→]/);
  });
});
