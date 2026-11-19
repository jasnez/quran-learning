/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import SourcesPage, { metadata } from "../page";

describe("Izvori (Sources) page", () => {
  it("renders page with heading Izvori podataka", async () => {
    const Page = await SourcesPage();
    render(Page);
    expect(screen.getByRole("heading", { name: /izvori podataka/i })).toBeInTheDocument();
  });

  it("has a meta description without HTML entities", () => {
    expect(metadata.description).not.toMatch(/&\w+;/);
    expect(metadata.description).toMatch(/arapski tekst/i);
    expect(metadata.description).toBe(
      "Izvori: arapski tekst, tedžvid oznake, transliteracija, prijevod i snimci učenja."
    );
  });

  it("contains section about the Kur'an text (Quran.com)", async () => {
    const Page = await SourcesPage();
    render(Page);
    expect(screen.getAllByRole("heading", { name: /^kur'anski tekst$/i }).length).toBeGreaterThanOrEqual(1);
  });

  it("credits the tedžvid annotations to cpfair under CC BY 4.0 and names the changes", async () => {
    const Page = await SourcesPage();
    render(Page);
    expect(screen.getAllByRole("heading", { name: /^tedžvid oznake$/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole("link", { name: "cpfair/quran-tajweed" })[0]).toHaveAttribute(
      "href",
      "https://github.com/cpfair/quran-tajweed"
    );
    expect(screen.getAllByRole("link", { name: "CC BY 4.0" })[0]).toHaveAttribute(
      "href",
      "https://creativecommons.org/licenses/by/4.0/"
    );
    expect(screen.getAllByRole("link", { name: "tanzil.net" })[0]).toHaveAttribute("href", "https://tanzil.net");
    expect(screen.getAllByText(/izmjene:/i).length).toBeGreaterThanOrEqual(1);
  });

  it("names everyayah.com as the source of the recordings", async () => {
    const Page = await SourcesPage();
    render(Page);
    expect(screen.getAllByRole("heading", { name: "Snimci učenja" }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole("link", { name: "everyayah.com" })[0]).toHaveAttribute(
      "href",
      "https://everyayah.com"
    );
  });

  it("says the transliteration follows the IZ BiH rules and links to the letter table", async () => {
    const Page = await SourcesPage();
    render(Page);
    expect(screen.getAllByRole("heading", { name: /^transliteracija$/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole("link", { name: /pravila transkripcije i transliteracije/i })[0]).toHaveAttribute(
      "href",
      "https://ilmijja.ba/wp-content/uploads/2022/03/Pravila.pdf"
    );
    expect(screen.getAllByRole("link", { name: /harfovi i izgovor/i })[0]).toHaveAttribute("href", "/harfovi");
  });

  it("contains section about ayah structure and word timings (Quran.com)", async () => {
    const Page = await SourcesPage();
    render(Page);
    const headings = screen.getAllByRole("heading", { name: /struktura ajeta i vremena riječi/i });
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
    const disclaimer = screen.getAllByText("Aplikacija nije zvanično povezana ni s jednom od navedenih ustanova.");
    expect(disclaimer.length).toBeGreaterThanOrEqual(1);
  });

  it("has link back to home", async () => {
    const Page = await SourcesPage();
    const { container } = render(Page);
    const article = container.querySelector("article");
    const homeLink = article?.querySelector('a[href="/"]');
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveTextContent(/^Na početnu$/);
  });

  it("names Quran.com as a service, not as an API of a platform", async () => {
    const { container } = render(await SourcesPage());
    expect(container.textContent).not.toMatch(/API|platform/i);
    expect(container.textContent).toContain("Arapski tekst Kur'ana (Uthmani pismo) preuzet je sa servisa Quran.com.");
    expect(container.textContent).toContain("Tekst prijevoda preuzet je sa servisa Quran.com.");
    expect(container.textContent).toContain(
      "vremena riječi za praćenje učenja preuzeti su sa servisa Quran.com."
    );
    expect(container.textContent).toContain("bojom su istaknuta samo četiri pravila (mad, ghunnah, ikhfa i qalqalah).");
    expect(container.textContent).toContain("Transliteracija ajeta i dova napravljena je iz arapskog teksta, sistemom");
  });
});
