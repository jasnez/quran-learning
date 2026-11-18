/**
 * @vitest-environment jsdom
 *
 * QA P2-8: every card that scrolled past (and the target of a ?ayah= jump) was recorded as
 * read. The owner chose: an ayah is read once its card has been in view for 2 seconds, in view
 * meaning at least half the card, or half the screen for an ayah taller than that.
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render } from "@testing-library/react";
import { AyahCard } from "../AyahCard";
import type { Ayah } from "@/types/quran";

const mockMarkAyahRead = vi.fn();

vi.mock("@/store/progressStore", () => ({
  useProgressStore: { getState: () => ({ markAyahRead: mockMarkAyahRead, updateLastPosition: vi.fn() }) },
}));

vi.mock("@/store/playerStore", () => ({
  usePlayerStore: vi.fn((sel: (s: unknown) => unknown) =>
    sel({ currentAyahId: null, isPlaying: false, setQueue: vi.fn(), play: vi.fn(), pause: vi.fn() }),
  ),
}));

vi.mock("@/store/bookmarkStore", async (importOriginal) => ({
  hasBookmark: (await importOriginal<typeof import("@/store/bookmarkStore")>()).hasBookmark,
  useBookmarkStore: vi.fn((sel: (s: unknown) => unknown) => sel({ toggleBookmark: vi.fn(), bookmarks: [] })),
}));

vi.mock("@/store/toastStore", () => ({
  useToastStore: vi.fn((sel: (s: unknown) => unknown) => sel({ showToast: vi.fn() })),
}));

vi.mock("@/hooks/useMediaQuery", () => ({ useIsMobile: vi.fn(() => false) }));

const ayah = {
  id: "2:20",
  ayahNumber: 20,
  ayahNumberGlobal: 27,
  juz: 1,
  page: 4,
  arabicText: "بِسْمِ",
  transliteration: "Bismi",
  translationBosnian: "U ime",
  tajwidSegments: [{ text: "بِسْمِ", rule: "normal" }],
  audio: { reciterId: "x", url: "/a.mp3", durationMs: 0 },
} as Ayah;

type Callback = (entries: Partial<IntersectionObserverEntry>[]) => void;
let report: Callback = () => {};

class ControlledIntersectionObserver {
  constructor(callback: Callback) {
    report = callback;
  }
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
}

const SCREEN = 800;
/** The card as the observer reports it: how much of it is on screen. */
function visible(ratio: number, heightPx: number) {
  act(() =>
    report([
      {
        isIntersecting: ratio > 0,
        intersectionRatio: ratio,
        intersectionRect: { height: heightPx } as DOMRectReadOnly,
        rootBounds: { height: SCREEN } as DOMRectReadOnly,
      },
    ]),
  );
}

function renderCard() {
  render(
    <AyahCard
      ayah={ayah}
      queueAyahs={[ayah]}
      surahNameLatin="El-Beqare"
      arabicFontSize={28}
      showTransliteration
      showTranslation
      showTajwidColors
    />,
  );
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("IntersectionObserver", ControlledIntersectionObserver);
  mockMarkAyahRead.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("AyahCard read tracking", () => {
  it("records the ayah as read after it has been in view for 2 seconds", () => {
    renderCard();
    visible(0.6, 120);
    act(() => vi.advanceTimersByTime(1999));
    expect(mockMarkAyahRead).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(mockMarkAyahRead).toHaveBeenCalledExactlyOnceWith(2, 20);
  });

  it("does not record a card that scrolls past within 2 seconds", () => {
    renderCard();
    visible(1, 200);
    act(() => vi.advanceTimersByTime(800));
    visible(0, 0);
    act(() => vi.advanceTimersByTime(5000));
    expect(mockMarkAyahRead).not.toHaveBeenCalled();
  });

  it("goes by the latest of several reports delivered at once", () => {
    // A busy main thread (a hard load of a long surah) delivers "came in" and "went out" of a
    // card that a ?ayah= jump scrolled past in one callback.
    renderCard();
    act(() =>
      report([
        { isIntersecting: true, intersectionRatio: 1, intersectionRect: { height: 200 } as DOMRectReadOnly, rootBounds: { height: SCREEN } as DOMRectReadOnly },
        { isIntersecting: false, intersectionRatio: 0, intersectionRect: { height: 0 } as DOMRectReadOnly, rootBounds: { height: SCREEN } as DOMRectReadOnly },
      ]),
    );
    act(() => vi.advanceTimersByTime(5000));
    expect(mockMarkAyahRead).not.toHaveBeenCalled();
  });

  it("does not count a sliver at the edge of the screen", () => {
    renderCard();
    visible(0.2, 40);
    act(() => vi.advanceTimersByTime(5000));
    expect(mockMarkAyahRead).not.toHaveBeenCalled();
  });

  it("counts an ayah taller than the screen once it fills half of it", () => {
    renderCard();
    visible(0.3, SCREEN * 0.6);
    act(() => vi.advanceTimersByTime(2000));
    expect(mockMarkAyahRead).toHaveBeenCalledExactlyOnceWith(2, 20);
  });

  it("starts the 2 seconds again when the card comes back", () => {
    renderCard();
    visible(0.6, 120);
    act(() => vi.advanceTimersByTime(1500));
    visible(0.2, 40);
    visible(0.6, 120);
    act(() => vi.advanceTimersByTime(1500));
    expect(mockMarkAyahRead).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(500));
    expect(mockMarkAyahRead).toHaveBeenCalledTimes(1);
  });

  it("records an ayah only once", () => {
    renderCard();
    visible(0.6, 120);
    act(() => vi.advanceTimersByTime(2000));
    visible(0, 0);
    visible(0.6, 120);
    act(() => vi.advanceTimersByTime(5000));
    expect(mockMarkAyahRead).toHaveBeenCalledTimes(1);
  });
});
