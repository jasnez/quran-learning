/**
 * @vitest-environment jsdom
 *
 * Rosette: the ayah number in the eight-pointed mark of a mushaf. Ornament for the eye only: the
 * ayah unit names the ayah for screen readers.
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { Rosette } from "../Rosette";

afterEach(cleanup);

describe("Rosette", () => {
  it("shows the number but keeps it out of the accessibility tree", () => {
    render(<Rosette number={7} />);
    const number = screen.getByText("7");
    const rosette = number.closest("[data-rosette]");
    expect(rosette).not.toBeNull();
    expect(rosette).toHaveAttribute("aria-hidden", "true");
  });

  it("draws two squares, the second turned by 45 degrees, in gold", () => {
    const { container } = render(<Rosette number={1} />);
    const rects = container.querySelectorAll("svg rect");
    expect(rects).toHaveLength(2);
    expect(rects[0]).toHaveAttribute("width", "23");
    expect(rects[1]).toHaveAttribute("transform", "rotate(45 20 20)");
    expect(container.querySelector("svg")).toHaveClass("text-gold");
  });

  it("is 32 px, is not selected with the ayah text, and reads left to right inside Arabic", () => {
    const { container } = render(<Rosette number={12} />);
    const rosette = container.querySelector("[data-rosette]");
    expect(rosette).toHaveClass("h-8", "w-8", "select-none", "[direction:ltr]", "font-sans", "text-ink");
  });

  it("uses a smaller number from three digits on, so 286 fits", () => {
    const { container, rerender } = render(<Rosette number={99} />);
    const rosette = () => container.querySelector("[data-rosette]");
    expect(rosette()).toHaveClass("text-xs");
    rerender(<Rosette number={286} />);
    expect(rosette()).toHaveClass("text-[0.6875rem]");
    expect(rosette()).not.toHaveClass("text-xs");
  });

  it("is filled with gold at 25% only while its ayah plays", () => {
    const { container, rerender } = render(<Rosette number={2} />);
    const svg = () => container.querySelector("svg");
    expect(svg()).toHaveClass("fill-none");
    rerender(<Rosette number={2} filled />);
    expect(svg()).toHaveClass("fill-gold/25");
    expect(container.querySelector("[data-rosette]")).toHaveAttribute("data-filled", "true");
  });
});
