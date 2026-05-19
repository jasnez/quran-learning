import { vi } from "vitest";

// next/navigation hooks default mock — individual tests can override via vi.mock.
// SurahReaderContent now reads ?ayah and ?autoplay via useSearchParams, so every
// test that renders it (directly or through a page) needs this.
vi.mock("next/navigation", async (orig) => {
  const actual = (await orig()) as Record<string, unknown>;
  return {
    ...actual,
    useSearchParams: () => ({
      get: () => null,
      has: () => false,
      getAll: () => [],
      keys: () => [].values(),
      values: () => [].values(),
      entries: () => [].entries(),
      forEach: () => {},
      toString: () => "",
      [Symbol.iterator]: () => [].values(),
    }),
  };
});

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
