/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import CategoryDuasPage from "../page";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

beforeEach(() => {
  cleanup();
});

describe("Duas category page (/duas/[category])", () => {
  it("when category is forgiveness, shows heading Za oprost and only that category duas", async () => {
    const Page = await CategoryDuasPage({
      params: Promise.resolve({ category: "forgiveness" }),
    });
    render(Page);
    const zaOprost = screen.getAllByRole("heading", { name: /Za oprost/i });
    expect(zaOprost.length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByRole("heading", { name: /Rabbena dove/i })).not.toBeInTheDocument();
  });

  it("when category is rabbana, shows Rabbena dove heading", async () => {
    const Page = await CategoryDuasPage({
      params: Promise.resolve({ category: "rabbana" }),
    });
    render(Page);
    const rabbana = screen.getAllByRole("heading", { name: /Rabbena dove/i });
    expect(rabbana.length).toBeGreaterThanOrEqual(1);
  });

  it("has link back to all duas", async () => {
    const Page = await CategoryDuasPage({
      params: Promise.resolve({ category: "forgiveness" }),
    });
    render(Page);
    const links = screen.getAllByRole("link", { name: /sve kur'anske dove|nazad|sve dove/i });
    expect(links.length).toBeGreaterThanOrEqual(1);
    expect(links[0]).toHaveAttribute("href", "/duas");
  });
});
