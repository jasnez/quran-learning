/**
 * @vitest-environment jsdom
 *
 * ChoiceGroup: one of two to four options, built from a fieldset and native radios, so the arrow
 * keys and screen readers work without extra code. The chosen option has the one selected look.
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChoiceGroup, SELECTED_CLASSES } from "@/components/ui";

afterEach(cleanup);

const OPTIONS = [
  { value: "off", label: "Isključeno" },
  { value: "surah", label: "Sura" },
  { value: "ayah", label: "Ajet" },
] as const;

function setup(value: "off" | "surah" | "ayah" = "off") {
  const onChange = vi.fn();
  render(<ChoiceGroup legend="Ponavljanje" name="repeat" options={OPTIONS} value={value} onChange={onChange} />);
  return onChange;
}

describe("ChoiceGroup", () => {
  it("is a group named by its legend, with one radio per option", () => {
    setup();
    const group = screen.getByRole("group", { name: "Ponavljanje" });
    expect(group.tagName).toBe("FIELDSET");
    expect(screen.getAllByRole("radio").map((r) => r.getAttribute("value"))).toEqual(["off", "surah", "ayah"]);
    expect(screen.getByRole("radio", { name: "Sura" })).toBeInTheDocument();
  });

  it("checks the radio of the current value only", () => {
    setup("surah");
    expect(screen.getByRole("radio", { name: "Sura" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Isključeno" })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: "Ajet" })).not.toBeChecked();
  });

  it("reports the clicked option", async () => {
    const onChange = setup("off");
    await userEvent.click(screen.getByRole("radio", { name: "Ajet" }));
    expect(onChange).toHaveBeenCalledWith("ayah");
  });

  it("moves to the next option with the right arrow key", async () => {
    const onChange = setup("off");
    screen.getByRole("radio", { name: "Isključeno" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenCalledWith("surah");
  });

  it("draws the chosen option with the selected classes and the others without", () => {
    setup("surah");
    const chosen = screen.getByRole("radio", { name: "Sura" }).closest("label");
    const other = screen.getByRole("radio", { name: "Ajet" }).closest("label");
    expect(chosen).toHaveClass(...SELECTED_CLASSES.split(" "));
    for (const cls of ["bg-accent-wash", "border-accent-text"]) expect(other).not.toHaveClass(cls);
    // The border is what makes the pill a shape on its track: the wash alone is 1.01:1 there.
    expect(chosen).toHaveClass("border-[1.5px]");
  });

  it("can hide the legend from sight but keeps the group's name", () => {
    render(
      <ChoiceGroup legend="Pregled" hideLegend name="view" options={OPTIONS} value="off" onChange={() => {}} />,
    );
    expect(screen.getByRole("group", { name: "Pregled" })).toBeInTheDocument();
    expect(screen.getByText("Pregled")).toHaveClass("sr-only");
  });

  it("points to its description", () => {
    render(
      <ChoiceGroup legend="Tedžvid" name="tj" options={OPTIONS} value="off" onChange={() => {}} describedBy="hint" />,
    );
    expect(screen.getByRole("group", { name: "Tedžvid" })).toHaveAttribute("aria-describedby", "hint");
  });
});
