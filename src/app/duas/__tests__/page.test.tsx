/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import DuasPage from "../page";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

describe("Duas page", () => {
  it("renders main heading Kur'anske dove", async () => {
    const Page = await DuasPage();
    render(Page);
    expect(
      screen.getByRole("heading", { name: /kur'anske dove/i })
    ).toBeInTheDocument();
  });

  it("renders category sections with duas", async () => {
    const Page = await DuasPage();
    render(Page);
    const rabbanaHeadings = screen.getAllByRole("heading", { name: /Rabbena dove/i });
    expect(rabbanaHeadings.length).toBeGreaterThanOrEqual(1);
    const labels = screen.getAllByText(/Dova iz Kur'an/i);
    expect(labels.length).toBeGreaterThanOrEqual(1);
  });

  it("renders at least one citation link to surah", async () => {
    const Page = await DuasPage();
    render(Page);
    const links = screen.getAllByRole("link", { name: /Kur'an\s+\d+:\d+/i });
    expect(links.length).toBeGreaterThanOrEqual(1);
    expect(links[0]).toHaveAttribute("href", expect.stringMatching(/^\/surah\/\d+\?ayah=\d+$/));
  });
});
