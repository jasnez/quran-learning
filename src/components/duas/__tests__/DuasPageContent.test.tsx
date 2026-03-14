/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { DuasPageContent } from "../DuasPageContent";

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

describe("DuasPageContent", () => {
  it("when no category prop, renders multiple category sections", () => {
    render(<DuasPageContent />);
    const rabbana = screen.getAllByRole("heading", { name: /Rabbana dove/i });
    expect(rabbana.length).toBeGreaterThanOrEqual(1);
    const labels = screen.getAllByText(/Dova iz Kur'an/i);
    expect(labels.length).toBeGreaterThanOrEqual(1);
  });

  it("when category=forgiveness, renders only one category section (Za oprost)", () => {
    render(<DuasPageContent category="forgiveness" />);
    const zaOprost = screen.getAllByRole("heading", { name: /Za oprost/i });
    expect(zaOprost.length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByRole("heading", { name: /Rabbana dove/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Za znanje/i })).not.toBeInTheDocument();
  });

  it("when category=rabbana, renders only Rabbana dove section", () => {
    render(<DuasPageContent category="rabbana" />);
    const rabbana = screen.getAllByRole("heading", { name: /Rabbana dove/i });
    expect(rabbana.length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByRole("heading", { name: /Za oprost/i })).not.toBeInTheDocument();
  });

  it("renders each category section with horizontal scroll container for cards", () => {
    render(<DuasPageContent />);
    const sections = document.querySelectorAll("[aria-labelledby^='duas-category-']");
    expect(sections.length).toBeGreaterThanOrEqual(1);
    sections.forEach((section) => {
      const scrollContainer = section.querySelector(".overflow-x-auto");
      expect(scrollContainer).toBeInTheDocument();
      expect(scrollContainer?.classList.contains("flex")).toBe(true);
    });
  });

  it("merges consecutive verses in same surah (e.g. 3:191–194 as one card)", () => {
    render(<DuasPageContent category="rabbana" />);
    const link = screen.queryByRole("link", { name: /Kur'an\s+3:191[–-]194/i });
    expect(link).toBeInTheDocument();
  });
});
