/**
 * @vitest-environment jsdom
 *
 * The ayah on screen (the header's "3/7" and the desktop ayah list): the topmost ayah among all
 * that are in the reading band, not only among those the observer reported last. The observer
 * reports changes only, so the hook has to remember which ayahs are in the band.
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import type { Ayah } from "@/types/quran";
import { useReaderPositionStore } from "@/store/readerPositionStore";
import { useActiveAyahObserver } from "../useActiveAyahObserver";

type Callback = (entries: Partial<IntersectionObserverEntry>[]) => void;
let report: Callback = () => {};
const disconnect = vi.fn();

class FakeObserver {
  constructor(callback: Callback) {
    report = callback;
  }
  observe() {}
  unobserve() {}
  disconnect = disconnect;
}

const ayahs = [1, 2, 3, 4].map((n) => ({ id: `112:${n}`, ayahNumber: n })) as unknown as Ayah[];

function Reader({ list }: { list: Ayah[] }) {
  useActiveAyahObserver(list);
  return (
    <ul>
      {list.map((a) => (
        <li key={a.id} data-ayah-id={a.id} />
      ))}
    </ul>
  );
}

/** One observer report: these ayahs entered the band, those left it. */
function change(entered: number[], left: number[] = []) {
  const entry = (n: number, isIntersecting: boolean) => ({
    isIntersecting,
    target: document.querySelector(`[data-ayah-id="112:${n}"]`)!,
  });
  act(() => report([...entered.map((n) => entry(n, true)), ...left.map((n) => entry(n, false))]));
}

const current = () => useReaderPositionStore.getState().ayahNumber;

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", FakeObserver);
  useReaderPositionStore.setState({ ayahNumber: 3 });
  disconnect.mockClear();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("useActiveAyahObserver", () => {
  it("starts a surah at its first ayah", () => {
    render(<Reader list={ayahs} />);
    expect(current()).toBe(1);
  });

  it("follows the ayah that enters the reading band", () => {
    render(<Reader list={ayahs} />);
    change([2], [1]);
    expect(current()).toBe(2);
  });

  it("scrolling down: stays on the upper ayah while it is still in the band with the next one", () => {
    render(<Reader list={ayahs} />);
    change([1]);
    // Ayah 2 enters while ayah 1 is still there: the report holds only the change.
    change([2]);
    expect(current()).toBe(1);
    // Ayah 1 leaves: now ayah 2 is the topmost one.
    change([], [1]);
    expect(current()).toBe(2);
  });

  it("scrolling up: moves to the upper ayah as soon as it enters", () => {
    render(<Reader list={ayahs} />);
    change([3]);
    change([2]);
    expect(current()).toBe(2);
  });

  it("keeps the last ayah when the band is empty (a tall gap between ayahs)", () => {
    render(<Reader list={ayahs} />);
    change([4]);
    change([], [4]);
    expect(current()).toBe(4);
  });

  it("stops observing when the reader goes away", () => {
    const { unmount } = render(<Reader list={ayahs} />);
    unmount();
    expect(disconnect).toHaveBeenCalled();
  });
});
