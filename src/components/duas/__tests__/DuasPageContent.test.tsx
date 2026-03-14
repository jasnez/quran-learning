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
});
