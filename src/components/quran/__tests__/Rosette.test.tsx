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

  // The browser check at 24, 28 and 44 px letters: a fixed 32 px mark looks lost next to 44 px
  // letters, so it grows with them and never goes under 32 px.
  it("is 32 px and grows with large letters; it is not selected with the text and reads left to right", () => {
    const { container } = render(<Rosette number={12} />);
    const rosette = container.querySelector("[data-rosette]");
    expect(rosette).toHaveClass("h-[max(2rem,1.1em)]", "w-[max(2rem,1.1em)]", "select-none", "[direction:ltr]");
    // No font size of its own: its em is the Arabic text's size.
    expect(rosette!.className).not.toMatch(/\btext-(xs|sm|base|\[)/);
    expect(screen.getByText("12")).toHaveClass("font-sans", "font-semibold", "text-ink");
  });

  it("uses a smaller number from three digits on, so 286 fits", () => {
    const { rerender } = render(<Rosette number={99} />);
    expect(screen.getByText("99")).toHaveClass("text-[length:max(0.75rem,0.38em)]");
    rerender(<Rosette number={286} />);
    expect(screen.getByText("286")).toHaveClass("text-[length:max(0.6875rem,0.33em)]");
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
