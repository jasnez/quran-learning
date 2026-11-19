/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { preferredScrollBehavior } from "../scrollBehavior";

function mockMatchMedia(reduce: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: reduce && query === "(prefers-reduced-motion: reduce)",
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("preferredScrollBehavior", () => {
  it("is auto when the user prefers reduced motion", () => {
    mockMatchMedia(true);
    expect(preferredScrollBehavior()).toBe("auto");
  });

  it("is smooth otherwise", () => {
    mockMatchMedia(false);
    expect(preferredScrollBehavior()).toBe("smooth");
  });
});
