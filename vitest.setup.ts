import { vi } from "vitest";

// jsdom does not provide matchMedia; required by useMediaQuery (AyahCard, etc.)
if (typeof window !== "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    })),
  });
}

// jsdom does not provide IntersectionObserver; required by AyahCard
if (typeof globalThis.IntersectionObserver === "undefined") {
  (globalThis as unknown as { IntersectionObserver: typeof IntersectionObserver }).IntersectionObserver = class MockIntersectionObserver {
    observe = vi.fn();
    disconnect = vi.fn();
    unobserve = vi.fn();
    root = null;
    rootMargin = "";
    thresholds: number[] = [];
    takeRecords = vi.fn();
  } as unknown as typeof IntersectionObserver;
}
