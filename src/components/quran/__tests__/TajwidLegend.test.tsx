/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TajwidLegend } from "../TajwidLegend";
import { tajwidRuleDescriptions, tajwidRuleNames } from "@/lib/quran/tajwidStyles";
import type { TajwidRule } from "@/types/quran";

const TAJWID_RULES: TajwidRule[] = ["normal", "mad", "ghunnah", "ikhfa", "qalqalah"];

describe("TajwidLegend", () => {
  beforeEach(() => {
    cleanup();
    document.body.innerHTML = "";
  });

  it("is collapsed by default (legend panel has max-height 0)", () => {
    const { container } = render(<TajwidLegend />);
    const panel = container.querySelector("#tajwid-legend-panel");
    expect(panel).toBeInTheDocument();
    expect(panel?.className).toMatch(/max-h-0/);
  });

  it("explains that only four rules are coloured", async () => {
    const user = userEvent.setup();
    render(<TajwidLegend />);
    await user.click(screen.getByRole("button", { name: "Šta znače boje" }));
    expect(
      screen.getByText("Boje pokazuju četiri pravila izgovora. Ostala pravila nisu obojena."),
    ).toBeInTheDocument();
  });

  it("has a discreet toggle button", () => {
    render(<TajwidLegend />);
    const toggle = screen.getByRole("button", { name: /šta znače boje/i });
    expect(toggle).toBeInTheDocument();
  });

  it("when opened, shows all 5 rules with Bosnian descriptions from central mapping", async () => {
    const user = userEvent.setup();
    render(<TajwidLegend />);
    const toggle = screen.getByRole("button", { name: /šta znače boje/i });
    await user.click(toggle);

    for (const rule of TAJWID_RULES) {
      expect(screen.getByText(tajwidRuleNames[rule])).toBeInTheDocument();
      if (rule !== "normal") {
        const text = tajwidRuleDescriptions[rule];
        expect(screen.getByText(`${text[0].toUpperCase()}${text.slice(1)}.`)).toBeInTheDocument();
      }
    }
  });

  it("when opened, shows rule names (mad, ghunnah, ikhfa, qalqalah, normal)", async () => {
    const user = userEvent.setup();
    render(<TajwidLegend />);
    await user.click(screen.getByRole("button", { name: /šta znače boje/i }));

    expect(screen.getByText("Bez pravila")).toBeInTheDocument();
    expect(screen.getByText("Medd")).toBeInTheDocument();
    expect(screen.getByText("Gunne")).toBeInTheDocument();
    expect(screen.getByText("Ihfa")).toBeInTheDocument();
    expect(screen.getByText("Kalkala")).toBeInTheDocument();
    expect(screen.getByText("Glas se produžava.")).toBeInTheDocument();
    expect(screen.getByText("Odskok glasa.")).toBeInTheDocument();
  });

  it("when opened, each rule has a color swatch (dot) with matching tajwid class", async () => {
    const user = userEvent.setup();
    const { container } = render(<TajwidLegend />);
    await user.click(screen.getByRole("button", { name: /šta znače boje/i }));
    await screen.findByText(tajwidRuleNames.mad);

    // Swatches use the same colors as tajwidRuleClasses (emerald, rose, sky, amber)
    expect(container.querySelector("[class*='text-emerald']")).not.toBeNull();
    expect(container.querySelector("[class*='text-rose']")).not.toBeNull();
    expect(container.querySelector("[class*='text-sky']")).not.toBeNull();
    expect(container.querySelector("[class*='text-amber']")).not.toBeNull();
  });

  it("toggle closes the panel when open", async () => {
    const user = userEvent.setup();
    const { container } = render(<TajwidLegend />);
    const toggle = screen.getByRole("button", { name: /šta znače boje/i });
    await user.click(toggle);
    expect(screen.getByText(tajwidRuleNames.mad)).toBeInTheDocument();
    let panel = container.querySelector("#tajwid-legend-panel");
    expect(panel?.className).toMatch(/max-h-96/);
    await user.click(toggle);
    panel = container.querySelector("#tajwid-legend-panel");
    expect(panel?.className).toMatch(/max-h-0/);
  });
});
