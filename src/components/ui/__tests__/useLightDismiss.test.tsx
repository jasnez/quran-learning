/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useLightDismiss } from "../useLightDismiss";

// The dialog box sits at x 100-300, y 100-200; everything else is the backdrop.
const RECT = { left: 100, right: 300, top: 100, bottom: 200, width: 200, height: 100, x: 100, y: 100 };
const INSIDE = { clientX: 150, clientY: 150 };
const OUTSIDE = { clientX: 20, clientY: 20 };

function Harness() {
  const lightDismiss = useLightDismiss();
  return (
    <dialog data-testid="dialog" open {...lightDismiss}>
      Sadržaj
    </dialog>
  );
}

function setup() {
  render(<Harness />);
  const dialog = screen.getByTestId("dialog") as HTMLDialogElement;
  vi.spyOn(dialog, "getBoundingClientRect").mockReturnValue({ ...RECT, toJSON: () => RECT } as DOMRect);
  const close = vi.spyOn(dialog, "close").mockImplementation(() => {});
  return { dialog, close };
}

describe("useLightDismiss (Safari fallback for closedby)", () => {
  beforeEach(() => {
    // jsdom has no closedBy, like Safari; make sure no other test added it.
    expect("closedBy" in HTMLDialogElement.prototype).toBe(false);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("closes when press and release are both on the backdrop", () => {
    const { dialog, close } = setup();
    fireEvent.pointerDown(dialog, OUTSIDE);
    fireEvent.pointerUp(dialog, OUTSIDE);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("stays open for a press inside that is released on the backdrop (text selection)", () => {
    const { dialog, close } = setup();
    fireEvent.pointerDown(dialog, INSIDE);
    fireEvent.pointerUp(dialog, OUTSIDE);
    expect(close).not.toHaveBeenCalled();
  });

  it("stays open for a click inside", () => {
    const { dialog, close } = setup();
    fireEvent.pointerDown(dialog, INSIDE);
    fireEvent.pointerUp(dialog, INSIDE);
    expect(close).not.toHaveBeenCalled();
  });

  it("leaves light dismiss to the browser when it supports closedby", () => {
    Object.defineProperty(HTMLDialogElement.prototype, "closedBy", { value: "any", configurable: true });
    try {
      const { dialog, close } = setup();
      fireEvent.pointerDown(dialog, OUTSIDE);
      fireEvent.pointerUp(dialog, OUTSIDE);
      expect(close).not.toHaveBeenCalled();
    } finally {
      delete (HTMLDialogElement.prototype as { closedBy?: string }).closedBy;
    }
  });
});
