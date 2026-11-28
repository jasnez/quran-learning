/**
 * @vitest-environment jsdom
 *
 * WCAG 2.4.1: a skip link is the first focusable element and targets the main landmark.
 */
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { AppShell } from "../AppShell";

vi.mock("next/dynamic", () => ({ default: () => () => null }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSelectedLayoutSegment: () => null,
  useParams: () => ({}),
  useRouter: () => ({ push: vi.fn() }),
}));

afterEach(() => cleanup());

describe("skip link", () => {
  it("is the first focusable element and targets the focusable main", () => {
    const { container } = render(
      <AppShell>
        <p>Sadržaj</p>
      </AppShell>
    );
    const first = container.querySelector<HTMLElement>("a[href], button, input, select, textarea");
    expect(first).toBe(screen.getByRole("link", { name: "Preskoči na sadržaj" }));
    expect(first).toHaveAttribute("href", "#main-content");

    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "main-content");
    expect(main).toHaveAttribute("tabindex", "-1");
  });

  // A mouse click inside main focuses it (tabIndex -1); in forced-colors mode `outline-hidden`
  // paints a ring, so it applies only to keyboard focus (the skip link).
  it("hides the outline of main only for visible focus", () => {
    render(
      <AppShell>
        <p>Sadržaj</p>
      </AppShell>
    );
    const main = screen.getByRole("main");
    expect(main).toHaveClass("focus-visible:outline-hidden");
    expect(main).not.toHaveClass("focus:outline-hidden");
  });
});
