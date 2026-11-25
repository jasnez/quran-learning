/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TajwidLegend } from "../TajwidLegend";
import { useSettingsStore } from "@/store/settingsStore";
import { useToastStore } from "@/store/toastStore";
import { tajwidRuleClasses, tajwidRuleLessonSlugs, tajwidRuleLineClasses } from "@/lib/quran/tajwidStyles";

describe("TajwidLegend", () => {
  beforeEach(() => {
    cleanup();
    document.body.innerHTML = "";
    useSettingsStore.setState({ tajwidNoticeSeen: true, showTajwidLines: false });
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

  it("tells how to get a rule's name from the text", async () => {
    const user = userEvent.setup();
    render(<TajwidLegend />);
    await user.click(screen.getByRole("button", { name: "Šta znače boje" }));
    expect(screen.getByText("Dodirni obojeni harf za naziv pravila.")).toBeInTheDocument();
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

  describe("line samples", () => {
    it("with lines on, each rule name has a sample of its line style before it", async () => {
      useSettingsStore.setState({ showTajwidLines: true });
      const user = userEvent.setup();
      const { container } = render(<TajwidLegend />);
      await user.click(screen.getByRole("button", { name: /šta znače boje/i }));
      const samples = Array.from(container.querySelectorAll("[data-tj-line-sample]"));
      expect(samples.map((s) => s.getAttribute("data-tj-line-sample"))).toEqual(["mad", "ghunnah", "ikhfa", "qalqalah"]);
      expect(samples[1].className).toContain(tajwidRuleLineClasses.ghunnah);
      expect(samples[1].className).toContain(tajwidRuleClasses.ghunnah);
      expect(samples.every((s) => s.getAttribute("aria-hidden") === "true")).toBe(true);
      // The sample box reaches down to the line, so the dot and dash patterns are drawn in it.
      expect(samples.every((s) => s.classList.contains("tj-line-sample"))).toBe(true);
    });

    it("with lines off, no samples", async () => {
      const user = userEvent.setup();
      const { container } = render(<TajwidLegend />);
      await user.click(screen.getByRole("button", { name: /šta znače boje/i }));
      expect(container.querySelector("[data-tj-line-sample]")).toBeNull();
    });
  });

  // The notice about the new colors is fired by the reading screens (useTajwidNotice): the
  // legend lives in the settings sheet and may never be opened.
  it("fires no notice of its own", () => {
    useSettingsStore.setState({ tajwidNoticeSeen: false });
    const before = useToastStore.getState().showCount;
    render(<TajwidLegend />);
    expect(useToastStore.getState().showCount).toBe(before);
    expect(useSettingsStore.getState().tajwidNoticeSeen).toBe(false);
  });

  it("tells its host when a lesson link is followed, so a sheet around it can close", async () => {
    const onNavigate = vi.fn();
    render(<TajwidLegend onNavigate={onNavigate} />);
    await userEvent.click(screen.getByRole("button", { name: "Šta znače boje" }));
    const link = screen.getByRole("link", { name: "kalkala" });
    link.addEventListener("click", (e) => e.preventDefault());
    await userEvent.click(link);
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it("is a quiet block, not a card", () => {
    const { container } = render(<TajwidLegend />);
    expect(container.firstElementChild?.className).not.toMatch(/rounded-xl|bg-paper/);
  });
});
