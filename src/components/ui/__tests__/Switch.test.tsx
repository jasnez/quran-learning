/**
 * @vitest-environment jsdom
 *
 * Switch: one setting that is on or off and acts at once. The whole row is clickable through
 * the label; the name says what is on ("Transkripcija"), not "show" or "hide".
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Switch } from "@/components/ui";

afterEach(cleanup);

describe("Switch", () => {
  it("is a switch named by its visible label, with its state in aria-checked", () => {
    const { rerender } = render(<Switch label="Transkripcija" checked={false} onChange={() => {}} />);
    const sw = screen.getByRole("switch", { name: "Transkripcija" });
    expect(sw).toHaveAttribute("aria-checked", "false");
    rerender(<Switch label="Transkripcija" checked onChange={() => {}} />);
    expect(sw).toHaveAttribute("aria-checked", "true");
  });

  it("reports the new state on a click on the switch", async () => {
    const onChange = vi.fn();
    render(<Switch label="Prijevod" checked={false} onChange={onChange} />);
    await userEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("toggles on a click on the label text too", async () => {
    const onChange = vi.fn();
    render(<Switch label="Prijevod" checked onChange={onChange} />);
    await userEvent.click(screen.getByText("Prijevod"));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("is 44 by 26 px, accent when on and the control border color when off", () => {
    const { rerender } = render(<Switch label="Prijevod" checked onChange={() => {}} />);
    const sw = screen.getByRole("switch");
    expect(sw).toHaveClass("w-11", "h-[1.625rem]", "bg-accent");
    rerender(<Switch label="Prijevod" checked={false} onChange={() => {}} />);
    expect(sw).toHaveClass("bg-line-strong");
    expect(sw).not.toHaveClass("bg-accent");
  });

  it("uses the given id, so a caller can point at the switch", () => {
    render(<Switch id="show-translation" label="Prijevod" checked onChange={() => {}} />);
    expect(screen.getByRole("switch")).toHaveAttribute("id", "show-translation");
  });
});
