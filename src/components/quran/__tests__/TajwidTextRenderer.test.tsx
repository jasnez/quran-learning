/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { TajwidSegment } from "@/types/quran";
import { TajwidTextRenderer } from "../TajwidTextRenderer";

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
    // mad -> text-emerald
    expect(spans[1].className).toMatch(/text-emerald/);
    // ghunnah -> text-rose
    expect(spans[2].className).toMatch(/text-rose/);
  });

  it("when showColors is false, all segments use normal text color", () => {
    const { container } = render(<TajwidTextRenderer segments={segments} showColors={false} />);
    const spans = container.querySelectorAll("span");
    spans.forEach((span) => {
      expect(span.className).toMatch(/text-foreground/);
    });
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
