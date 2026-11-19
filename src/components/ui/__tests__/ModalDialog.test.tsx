/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { ModalDialog } from "../ModalDialog";

function setup(open: boolean, onClose = vi.fn()) {
  const ui = (isOpen: boolean) => (
    <ModalDialog open={isOpen} onClose={onClose} labelledBy="t">
      <h2 id="t">Naslov</h2>
      <button type="button">U redu</button>
    </ModalDialog>
  );
  const view = render(ui(open));
  const dialog = () => view.container.querySelector("dialog")!;
  return { dialog, onClose, rerender: (o: boolean) => view.rerender(ui(o)) };
}

afterEach(() => vi.restoreAllMocks());

describe("ModalDialog", () => {
  it("is closed when open is false", () => {
    const { dialog } = setup(false);
    expect(dialog()).not.toHaveAttribute("open");
  });

  it("opens with showModal() once when open turns true, and closes when it turns false", () => {
    const showModal = vi.spyOn(HTMLDialogElement.prototype, "showModal");
    const { dialog, rerender } = setup(false);
    rerender(true);
    expect(showModal).toHaveBeenCalledTimes(1);
    expect(dialog()).toHaveAttribute("open");
    rerender(false);
    expect(dialog()).not.toHaveAttribute("open");
  });

  it("calls onClose on the native close event", () => {
    const { dialog, onClose } = setup(true);
    fireEvent(dialog(), new Event("close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("is labelled by its heading and has no role or aria-modal", () => {
    const { dialog } = setup(true);
    expect(dialog()).toHaveAttribute("aria-labelledby", "t");
    expect(dialog()).not.toHaveAttribute("role");
    expect(dialog()).not.toHaveAttribute("aria-modal");
  });
});
