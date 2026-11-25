/**
 * @vitest-environment jsdom
 *
 * Button (Tezhib): primary, secondary, quiet, danger; 44 and 36 px; the control radius, never a
 * pill (pills are for choices).
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { Button, ButtonLink } from "@/components/ui";

afterEach(cleanup);

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    prefetch,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
    prefetch?: boolean;
  }) => (
    <a href={href} data-prefetch={prefetch === undefined ? "default" : String(prefetch)} {...rest}>
      {children}
    </a>
  ),
}));

describe("Button", () => {
  it("is a primary button of 44 px by default, with the control radius", () => {
    render(<Button>Pusti suru</Button>);
    const button = screen.getByRole("button", { name: "Pusti suru" });
    expect(button).toHaveClass("bg-accent", "text-on-accent", "hover:bg-accent-hover", "h-11", "rounded-control");
    expect(button.className).not.toMatch(/rounded-full/);
  });

  it("has a 36 px size for bars", () => {
    render(<Button size="sm">Ukloni</Button>);
    expect(screen.getByRole("button")).toHaveClass("h-9");
  });

  it.each([
    ["secondary", ["border-line-strong", "text-ink", "hover:bg-surface-sunken"]],
    ["quiet", ["text-accent-text", "hover:underline"]],
    ["danger", ["bg-danger", "text-on-accent"]],
  ] as const)("draws the %s variant", (variant, classes) => {
    render(<Button variant={variant}>Tekst</Button>);
    expect(screen.getByRole("button")).toHaveClass(...classes);
  });

  it("moves with the press duration and the standard easing", () => {
    render(<Button>Tekst</Button>);
    expect(screen.getByRole("button")).toHaveClass("duration-press", "ease-standard");
  });

  it("shows focus as an outline in the accent text color", () => {
    render(<Button>Tekst</Button>);
    expect(screen.getByRole("button")).toHaveClass(
      "focus-visible:outline-2",
      "focus-visible:outline-offset-2",
      "focus-visible:outline-accent-text",
    );
  });
});

describe("ButtonLink", () => {
  it("is a link with the same look", () => {
    render(
      <ButtonLink href="/surahs" variant="secondary">
        Sve sure
      </ButtonLink>,
    );
    const link = screen.getByRole("link", { name: "Sve sure" });
    expect(link).toHaveAttribute("href", "/surahs");
    expect(link).toHaveClass("border-line-strong", "h-11", "rounded-control");
  });

  it("passes prefetch on to the link, so a second copy of a surah is not downloaded", () => {
    render(
      <ButtonLink href="/learn/1" prefetch={false}>
        Uči ajet po ajet
      </ButtonLink>,
    );
    expect(screen.getByRole("link")).toHaveAttribute("data-prefetch", "false");
  });
});
