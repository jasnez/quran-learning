/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TajwidLegend } from "../TajwidLegend";
import { useSettingsStore } from "@/store/settingsStore";
import { useToastStore } from "@/store/toastStore";
import { tajwidRuleClasses, tajwidRuleLessonSlugs } from "@/lib/quran/tajwidStyles";

describe("TajwidLegend", () => {
  beforeEach(() => {
    cleanup();
    document.body.innerHTML = "";
    useSettingsStore.setState({ tajwidNoticeSeen: true });
    useToastStore.getState().clearToast();
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

  it("when opened, shows three rows by what the voice does", async () => {
    const user = userEvent.setup();
    render(<TajwidLegend />);
    await user.click(screen.getByRole("button", { name: /šta znače boje/i }));
    const items = screen.getAllByRole("listitem").map((li) => li.textContent?.replace(/^•/, "").trim());
    expect(items).toEqual([
      "Crveno: produži (medd)",
      "Zeleno: kroz nos (gunne, ihfa)",
      "Plavo: odskok (kalkala)",
    ]);
    expect(screen.queryByText("Bez pravila")).toBeNull();
  });

  it("links each rule name to its lesson", async () => {
    const user = userEvent.setup();
    render(<TajwidLegend />);
    await user.click(screen.getByRole("button", { name: /šta znače boje/i }));
    const expected: [string, keyof typeof tajwidRuleLessonSlugs][] = [
      ["medd", "mad"],
      ["gunne", "ghunnah"],
      ["ihfa", "ikhfa"],
      ["kalkala", "qalqalah"],
    ];
    for (const [name, rule] of expected) {
      expect(screen.getByRole("link", { name })).toHaveAttribute("href", `/tajwid/${tajwidRuleLessonSlugs[rule]}`);
    }
  });

  it("each row's dot has the row's tajwid color", async () => {
    const user = userEvent.setup();
    render(<TajwidLegend />);
    await user.click(screen.getByRole("button", { name: /šta znače boje/i }));
    const dots = screen.getAllByRole("listitem").map((li) => li.querySelector("[aria-hidden]")?.className ?? "");
    expect(dots[0]).toContain(tajwidRuleClasses.mad);
    expect(dots[1]).toContain(tajwidRuleClasses.ghunnah);
    expect(dots[2]).toContain(tajwidRuleClasses.qalqalah);
  });

  // jsdom does not take inert content out of the focus order; the Tab order is checked in a browser.
  it("collapsed: the panel is inert and hidden from screen readers; opened: neither", async () => {
    const user = userEvent.setup();
    const { container } = render(<TajwidLegend />);
    const panel = container.querySelector("#tajwid-legend-panel");
    expect(panel).toHaveAttribute("inert");
    expect(panel).toHaveAttribute("aria-hidden", "true");
    await user.click(screen.getByRole("button", { name: /šta znače boje/i }));
    expect(panel).not.toHaveAttribute("inert");
    expect(panel).toHaveAttribute("aria-hidden", "false");
  });

  it("opened: Tab goes from the toggle through medd, gunne, ihfa, kalkala", async () => {
    const user = userEvent.setup();
    render(<TajwidLegend />);
    await user.click(screen.getByRole("button", { name: /šta znače boje/i }));
    const order: string[] = [];
    for (let i = 0; i < 4; i++) {
      await user.tab();
      order.push(document.activeElement?.textContent ?? "");
    }
    expect(order).toEqual(["medd", "gunne", "ihfa", "kalkala"]);
  });

  it("toggle closes the panel when open", async () => {
    const user = userEvent.setup();
    const { container } = render(<TajwidLegend />);
    const toggle = screen.getByRole("button", { name: /šta znače boje/i });
    await user.click(toggle);
    expect(screen.getByRole("link", { name: "medd" })).toBeInTheDocument();
    let panel = container.querySelector("#tajwid-legend-panel");
    expect(panel?.className).toMatch(/max-h-96/);
    await user.click(toggle);
    panel = container.querySelector("#tajwid-legend-panel");
    expect(panel?.className).toMatch(/max-h-0/);
  });

  describe("one-time notice about the new colors", () => {
    const NOTICE = "Boje su sada kao u tedžvidskom mushafu.";

    it("shows the notice once for someone who used the old colors, then remembers it", () => {
      useSettingsStore.setState({ tajwidNoticeSeen: false });
      const before = useToastStore.getState().showCount;
      render(<TajwidLegend />);
      expect(useToastStore.getState().message).toBe(NOTICE);
      expect(useToastStore.getState().showCount).toBe(before + 1);
      expect(useSettingsStore.getState().tajwidNoticeSeen).toBe(true);

      cleanup();
      render(<TajwidLegend />);
      expect(useToastStore.getState().showCount).toBe(before + 1);
    });

    it("shows nothing when the notice was already seen", () => {
      const before = useToastStore.getState().showCount;
      render(<TajwidLegend />);
      expect(useToastStore.getState().showCount).toBe(before);
    });
  });
});
