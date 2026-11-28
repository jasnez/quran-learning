/**
 * @vitest-environment jsdom
 *
 * FilterChip: a button that is on or off (aria-pressed), drawn like the chosen option of a
 * ChoiceGroup when on.
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilterChip, SELECTED_CLASSES } from "@/components/ui";

afterEach(cleanup);

describe("FilterChip", () => {
  it("is a button whose pressed state follows the prop", () => {
    const { rerender } = render(<FilterChip pressed={false} onToggle={() => {}}>Započete</FilterChip>);
    const chip = screen.getByRole("button", { name: "Započete" });
    expect(chip).toHaveAttribute("aria-pressed", "false");
    expect(chip).toHaveAttribute("type", "button");
    rerender(<FilterChip pressed onToggle={() => {}}>Započete</FilterChip>);
    expect(chip).toHaveAttribute("aria-pressed", "true");
  });

  it("calls onToggle on a click", async () => {
    const onToggle = vi.fn();
    render(<FilterChip pressed={false} onToggle={onToggle}>Prijevod</FilterChip>);
    await userEvent.click(screen.getByRole("button"));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("has the selected classes only while pressed; idle it has a control border", () => {
    const { rerender } = render(<FilterChip pressed onToggle={() => {}}>Sve</FilterChip>);
    const chip = screen.getByRole("button");
    expect(chip).toHaveClass(...SELECTED_CLASSES.split(" "), "border-[1.5px]", "rounded-full", "h-8");
    rerender(<FilterChip pressed={false} onToggle={() => {}}>Sve</FilterChip>);
    expect(chip).toHaveClass("border-line-strong", "text-ink-muted");
    expect(chip).not.toHaveClass("bg-accent-wash");
  });
});
