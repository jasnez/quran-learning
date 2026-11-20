/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import ContactPage, { metadata } from "../page";
import { ISSUES_NEW_URL } from "@/lib/contact";

afterEach(() => cleanup());

describe("Contact page (QA P1-7)", () => {
  it("does not offer the non-existent quran-learning.ba address", () => {
    const { container } = render(<ContactPage />);
    expect(container.textContent).not.toMatch(/quran-learning\.ba/);
    expect(container.querySelector('a[href^="mailto:"]')).toBeNull();
  });

  it("links to GitHub Issues of the public repository", () => {
    render(<ContactPage />);
    const link = screen.getByRole("link", { name: /github/i });
    expect(link).toHaveAttribute("href", ISSUES_NEW_URL);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("rel")).toMatch(/noopener/);
  });

  it("uses the copy deck wording and a link home without an arrow", () => {
    render(<ContactPage />);
    expect(screen.getByText("Pitanje, prijedlog ili greška u tekstu? Piši nam preko GitHuba.")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Za prijavu treba besplatan GitHub nalog. Prijave su javne, pa ne upisuj lične podatke."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Ako je greška u tekstu, transkripciji, prijevodu ili snimku, navedi suru i ajet ili zalijepi link."
      )
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Na početnu" })).toHaveAttribute("href", "/");
    expect(metadata.description).toBe("Pitanja, prijedlozi i prijave grešaka.");
  });

  it("points at the real repository", () => {
    expect(ISSUES_NEW_URL).toBe("https://github.com/jasnez/quran-learning/issues/new");
  });
});
