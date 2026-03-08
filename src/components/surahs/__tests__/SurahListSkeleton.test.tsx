/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { SurahListSkeleton } from "../SurahListSkeleton";

describe("SurahListSkeleton", () => {
  it("renders multiple skeleton card placeholders", () => {
    const { container } = render(<SurahListSkeleton count={3} />);
    const skeletons = container.querySelectorAll("[data-skeleton-card]");
    expect(skeletons.length).toBe(3);
  });

  it("uses animate-pulse for loading appearance", () => {
    const { container } = render(<SurahListSkeleton count={1} />);
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });
});
