/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, it, expect } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import LettersPage from "../page";
import { ARABIC_LETTERS, ARABIC_VOWELS } from "@/lib/letters/data";

// The project runs Vitest without globals, so Testing Library does not clean up by itself.
afterEach(cleanup);

describe("Harfovi i izgovor page", () => {
  it("renders the heading", () => {
    render(<LettersPage />);
    expect(screen.getByRole("heading", { level: 1, name: /harfovi i izgovor/i })).toBeInTheDocument();
  });

  it("names the letter table by its caption and gives it column and row headers", () => {
    render(<LettersPage />);
    const table = screen.getByRole("table", { name: /arapski harfovi/i });
    expect(within(table).getAllByRole("columnheader").map((h) => h.textContent)).toEqual([
      "Harf",
      "U aplikaciji (specijal)",
      "Opća transkripcija",
      "Naučna (DMG)",
      "Izgovor",
    ]);
    expect(within(table).getAllByRole("rowheader")).toHaveLength(ARABIC_LETTERS.length);
  });

  it("shows every letter with its sign in the three systems", () => {
    render(<LettersPage />);
    const table = screen.getByRole("table", { name: /arapski harfovi/i });
    const rows = within(table).getAllByRole("row").slice(1);
    rows.forEach((row, i) => {
      const letter = ARABIC_LETTERS[i];
      expect(within(row).getByRole("rowheader")).toHaveTextContent(`${letter.arabic} ${letter.name}`);
      expect(within(row).getAllByRole("cell").map((c) => c.textContent)).toEqual([
        letter.special,
        letter.general,
        letter.dmg,
        letter.pronunciation,
      ]);
    });
  });

  it("marks the Arabic letter as Arabic text", () => {
    render(<LettersPage />);
    const glyph = screen.getByText(ARABIC_LETTERS[1].arabic);
    expect(glyph).toHaveAttribute("lang", "ar");
    expect(glyph).toHaveAttribute("dir", "rtl");
  });

  it("labels every cell so that the stacked layout on narrow screens keeps its column names", () => {
    render(<LettersPage />);
    const table = screen.getByRole("table", { name: /arapski harfovi/i });
    const cells = within(within(table).getAllByRole("row")[1]).getAllByRole("cell");
    expect(cells.map((c) => c.getAttribute("data-label"))).toEqual(["U aplikaciji", "Opća", "Naučna (DMG)", "Izgovor"]);
  });

  it("puts both tables in a named, keyboard-focusable region", () => {
    render(<LettersPage />);
    const regions = screen.getAllByRole("region");
    expect(regions).toHaveLength(2);
    for (const region of regions) expect(region).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("region", { name: /kratki i dugi vokali/i })).toBeInTheDocument();
  });

  it("shows the vowels", () => {
    render(<LettersPage />);
    const table = screen.getByRole("table", { name: /kratki i dugi vokali/i });
    expect(within(table).getAllByRole("rowheader")).toHaveLength(ARABIC_VOWELS.length);
  });

  it("links to the rules it follows and to the contact page", () => {
    render(<LettersPage />);
    expect(screen.getByRole("link", { name: /pravila transkripcije i transliteracije/i })).toHaveAttribute(
      "href",
      "https://ilmijja.ba/wp-content/uploads/2022/03/Pravila.pdf"
    );
    expect(screen.getByRole("link", { name: "Kontakt" })).toHaveAttribute("href", "/contact");
  });

  it("says where to report mistakes", () => {
    render(<LettersPage />);
    expect(screen.getByText(/Greške se prijavljuju na stranici/)).toBeInTheDocument();
  });

  it("says the transcription is made from the Arabic text, as the sources page does", () => {
    const { container } = render(<LettersPage />);
    expect(container.textContent).toContain("Transkripcija je napravljena iz arapskog teksta.");
  });
});
