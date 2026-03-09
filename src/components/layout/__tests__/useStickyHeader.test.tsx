/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { useStickyHeader } from "../useStickyHeader";

function TestComponent() {
  const state = useStickyHeader({ threshold: 24 });
  return (
    <div
      data-testid="sticky-state"
      data-at-top={state.isAtTop ? "true" : "false"}
      data-hidden={state.isHidden ? "true" : "false"}
      data-shadow={state.hasShadow ? "true" : "false"}
    />
  );
}

describe("useStickyHeader", () => {
  let scrollYValue = 0;

  beforeEach(() => {
    cleanup();
    scrollYValue = 0;
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      get: () => scrollYValue,
    });
  });

  it("starts visible at top without shadow", () => {
    render(<TestComponent />);
    const el = screen.getByTestId("sticky-state");
    expect(el).toHaveAttribute("data-at-top", "true");
    expect(el).toHaveAttribute("data-hidden", "false");
    expect(el).toHaveAttribute("data-shadow", "false");
  });

  it("hides header and adds shadow when scrolling down past threshold", async () => {
    render(<TestComponent />);
    const el = screen.getAllByTestId("sticky-state")[0] as HTMLElement;

    scrollYValue = 200;
    fireEvent.scroll(window);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(el).toHaveAttribute("data-at-top", "false");
    expect(el).toHaveAttribute("data-shadow", "true");
    expect(el).toHaveAttribute("data-hidden", "true");
  });

  it("shows header again when user scrolls up", async () => {
    render(<TestComponent />);
    const el = screen.getAllByTestId("sticky-state")[0] as HTMLElement;

    // Scroll down first
    scrollYValue = 200;
    fireEvent.scroll(window);
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Then scroll up
    scrollYValue = 100;
    fireEvent.scroll(window);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(el).toHaveAttribute("data-hidden", "false");
    expect(el).toHaveAttribute("data-shadow", "true");
  });
});

