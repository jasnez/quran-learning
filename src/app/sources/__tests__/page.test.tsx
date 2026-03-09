/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import SourcesPage from "../page";

describe("Izvori (Sources) page", () => {
  it("renders page with heading Izvori podataka", async () => {
    const Page = await SourcesPage();
    render(Page);
    expect(screen.getByRole("heading", { name: /izvori podataka/i })).toBeInTheDocument();
  });

  it("contains section about Kur'an text and tajwid (Tanzil)", async () => {
    const Page = await SourcesPage();
    render(Page);
    const headings = screen.getAllByRole("heading", { name: /kur'anski tekst i tajwid oznake/i });
    expect(headings.length).toBeGreaterThanOrEqual(1);
    const tanzilText = screen.getAllByText(/tanzil/i);
    expect(tanzilText.length).toBeGreaterThanOrEqual(1);
    const tanzilLinks = screen.getAllByRole("link", { name: "tanzil.net" });
    expect(tanzilLinks[0]).toHaveAttribute("href", "https://tanzil.net");
  });

  it("contains section about transliteration, structure and audio (Quran.com)", async () => {
    const Page = await SourcesPage();
    render(Page);
    const headings = screen.getAllByRole("heading", { name: /transliteracija, struktura ajeta i audio recitacije/i });
    expect(headings.length).toBeGreaterThanOrEqual(1);
    const quranText = screen.getAllByText(/quran\.com/i);
    expect(quranText.length).toBeGreaterThanOrEqual(1);
    const quranLinks = screen.getAllByRole("link", { name: "quran.com" });
    expect(quranLinks[0]).toHaveAttribute("href", "https://quran.com");
  });

  it("contains section about Bosnian translation (Besim Korkut)", async () => {
    const Page = await SourcesPage();
    render(Page);
    const headings = screen.getAllByRole("heading", { name: /bosanski prijevod/i });
    expect(headings.length).toBeGreaterThanOrEqual(1);
    const besimText = screen.getAllByText(/besim korkut/i);
    expect(besimText.length).toBeGreaterThanOrEqual(1);
  });

  it("contains disclaimer about no official affiliation", async () => {
    const Page = await SourcesPage();
    render(Page);
    const disclaimer = screen.getAllByText(/ova platforma nije.*povezana.*navedenih institucija/i);
    expect(disclaimer.length).toBeGreaterThanOrEqual(1);
  });

  it("has link back to home", async () => {
    const Page = await SourcesPage();
    const { container } = render(Page);
    const article = container.querySelector("article");
    const homeLink = article?.querySelector('a[href="/"]');
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveTextContent(/povratak|početnu/i);
  });
});
