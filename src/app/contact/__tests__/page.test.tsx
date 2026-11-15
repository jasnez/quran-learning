/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import ContactPage from "../page";
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

  it("points at the real repository", () => {
    expect(ISSUES_NEW_URL).toBe("https://github.com/jasnez/quran-learning/issues/new");
  });
});
