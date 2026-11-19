/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import DuasPage, { metadata } from "../page";

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

  it("says where each dua is in the Quran, with no loan word", async () => {
    render(await DuasPage());
    expect(
      screen.getAllByText("Dove iz Kur'ana po temama, uz tačno mjesto u Kur'anu (sura i ajet)").length
    ).toBeGreaterThanOrEqual(1);
    expect(metadata.description).toMatch(/Uz tačno mjesto u Kur'anu\.$/);
    expect(metadata.description).not.toMatch(/referenc/i);
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
