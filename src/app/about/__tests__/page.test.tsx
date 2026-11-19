/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import AboutPage, { metadata } from "../page";
import { SITE_NAME } from "@/lib/site";

afterEach(cleanup);

describe("O aplikaciji page", () => {
  it("is called an app, not a platform", () => {
    const { container } = render(<AboutPage />);
    expect(screen.getByRole("heading", { level: 1, name: "O aplikaciji" })).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/platform/i);
    expect(metadata.description).toBe(
      `${SITE_NAME} je besplatna aplikacija za učenje Kur'ana: arapski tekst, transliteracija, Korkutov prijevod i učač Mishary Alafasy.`
    );
  });

  it("introduces the app with the site name", () => {
    render(<AboutPage />);
    expect(
      screen.getByText(
        `${SITE_NAME} je besplatna aplikacija za učenje Kur'ana na bosanskom jeziku. Uz svaki ajet su arapski tekst, transliteracija po pravilima Rijaseta Islamske zajednice u Bosni i Hercegovini, prijevod značenja Besima Korkuta i učenje Mishary Alafasyja. Tu su i lekcije tedžvida, Allahova lijepa imena i dove iz Kur'ana.`
      )
    ).toBeInTheDocument();
  });

  it("lists the six features", () => {
    render(<AboutPage />);
    const section = screen.getByRole("heading", { name: "Mogućnosti" }).closest("section")!;
    expect(within(section).getAllByRole("listitem").map((li) => li.textContent)).toEqual([
      "Čitanje sure ajet po ajet, s transliteracijom i prijevodom",
      "Slušanje svakog ajeta, uz ponavljanje",
      "Lekcije tedžvida s kvizom",
      "Sačuvani ajeti s bilješkama",
      "Pretraga po riječi, nazivu sure ili broju ajeta",
      "Čitanje bez interneta, kad se sure preuzmu",
    ]);
  });

  it("states sources and independence in plain words, and links home without an arrow", () => {
    render(<AboutPage />);
    expect(
      screen.getByText(
        (_, el) =>
          el?.tagName === "P" &&
          el.textContent === "Tekst, transliteracija i snimci dolaze iz otvorenih izvora, navedenih na stranici Izvori."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Aplikacija je napravljena da olakša učenje Kur'ana. Nije zvanično povezana ni s jednom vjerskom ni obrazovnom ustanovom."
      )
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Izvori" })).toHaveAttribute("href", "/sources");
    expect(screen.getByRole("link", { name: "Na početnu" })).toHaveAttribute("href", "/");
  });
});
