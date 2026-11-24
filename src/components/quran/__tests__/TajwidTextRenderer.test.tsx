/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useTajwidRuleBarStore } from "@/store/tajwidRuleBarStore";
import type { TajwidSegment } from "@/types/quran";
import { TajwidTextRenderer } from "../TajwidTextRenderer";
import { tajwidRuleLineClasses } from "@/lib/quran/tajwidStyles";

const segments: TajwidSegment[] = [
  { text: "بِسْمِ", rule: "normal" },
  { text: " ٱللَّهِ", rule: "mad" },
  { text: " ٱلرَّحِيمِ", rule: "ghunnah" },
];

describe("TajwidTextRenderer", () => {
  it("renders each segment as a span with segment text", () => {
    render(<TajwidTextRenderer segments={segments} showColors={true} />);
    expect(screen.getByText("بِسْمِ")).toBeInTheDocument();
    expect(screen.getByText(/ٱللَّهِ/)).toBeInTheDocument();
    expect(screen.getByText(/ٱلرَّحِيمِ/)).toBeInTheDocument();
  });

  it("when showColors is true, applies tajwid rule class to each span", () => {
    const { container } = render(<TajwidTextRenderer segments={segments} showColors={true} />);
    const spans = container.querySelectorAll("span");
    expect(spans.length).toBe(segments.length);
    // normal -> text-foreground
    expect(spans[0].className).toMatch(/text-foreground/);
    // mad -> text-tj-medd
    expect(spans[1].className).toMatch(/text-tj-medd/);
    // ghunnah -> text-tj-gunne
    expect(spans[2].className).toMatch(/text-tj-gunne/);
  });

  it("when showColors is false, all segments use normal text color", () => {
    const { container } = render(<TajwidTextRenderer segments={segments} showColors={false} />);
    const spans = container.querySelectorAll("span");
    spans.forEach((span) => {
      expect(span.className).toMatch(/text-foreground/);
    });
  });

  it("with colors, a colored span carries its rule (data-tj-rule) and line classes; plain text none", () => {
    const { container } = render(<TajwidTextRenderer segments={segments} showColors={true} />);
    const spans = Array.from(container.querySelectorAll("span"));
    expect(spans.map((s) => s.getAttribute("data-tj-rule"))).toEqual([null, "mad", "ghunnah"]);
    expect(spans[1].className).toContain(tajwidRuleLineClasses.mad);
    expect(spans[2].className).toContain(tajwidRuleLineClasses.ghunnah);
  });

  it("without colors, no span carries a rule or a line", () => {
    const { container } = render(<TajwidTextRenderer segments={segments} showColors={false} />);
    const spans = Array.from(container.querySelectorAll("span"));
    expect(spans.some((s) => s.hasAttribute("data-tj-rule"))).toBe(false);
    expect(spans.some((s) => s.className.includes("data-tajwid-lines"))).toBe(false);
  });

  it("a tap on a colored letter opens the rule bar; a tap on plain text does not", () => {
    useTajwidRuleBarStore.setState({ rule: null });
    const { container } = render(<TajwidTextRenderer segments={segments} showColors={true} />);
    const spans = container.querySelectorAll("span");
    fireEvent.click(spans[0]);
    expect(useTajwidRuleBarStore.getState().rule).toBeNull();
    fireEvent.click(spans[2]);
    expect(useTajwidRuleBarStore.getState().rule).toBe("ghunnah");
  });

  // A double-click's first click comes before the selection and opens the bar like any tap.
  it("the click that ends selecting text by dragging does not open the rule bar", () => {
    useTajwidRuleBarStore.setState({ rule: null });
    const { container } = render(<TajwidTextRenderer segments={segments} showColors={true} />);
    const spans = container.querySelectorAll("span");
    window.getSelection()?.selectAllChildren(spans[2]);
    fireEvent.click(spans[2]);
    expect(useTajwidRuleBarStore.getState().rule).toBeNull();
    window.getSelection()?.removeAllRanges();
  });

  it("wrapper has dir=rtl and Arabic font class", () => {
    const { container } = render(<TajwidTextRenderer segments={segments} showColors={true} />);
    const wrapper = container.firstElementChild;
    expect(wrapper).toHaveAttribute("dir", "rtl");
    expect(wrapper?.className).toMatch(/font-arabic/);
  });

  it("renders empty when segments is empty", () => {
    const { container } = render(<TajwidTextRenderer segments={[]} showColors={true} />);
    const wrapper = container.firstElementChild;
    expect(wrapper).toBeInTheDocument();
    expect(wrapper?.querySelectorAll("span")).toHaveLength(0);
  });

  it("Arabic wrapper has generous line-height for readability (1.8-2.0)", () => {
    const { container } = render(<TajwidTextRenderer segments={segments} showColors={true} />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper?.className).toMatch(/leading-\[1\.[89]\]|leading-\[2\]|leading-loose|arabic-leading/);
  });
});
