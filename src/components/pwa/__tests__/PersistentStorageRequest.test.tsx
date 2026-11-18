/**
 * @vitest-environment jsdom
 *
 * Bookmarks and progress live only in localStorage, which the browser may evict (QA section 7).
 * The component asks for persistent storage, but only once the visitor has saved something:
 * Firefox shows a permission prompt for it.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, waitFor, act } from "@testing-library/react";
import { PersistentStorageRequest } from "../PersistentStorageRequest";
import { BOOKMARK_STORAGE_KEY, useBookmarkStore } from "@/store/bookmarkStore";
import { useProgressStore } from "@/store/progressStore";

const persist = vi.fn<() => Promise<boolean>>();
const persisted = vi.fn<() => Promise<boolean>>();

function stubStorageManager(value: unknown) {
  Object.defineProperty(navigator, "storage", { configurable: true, value });
}

beforeEach(() => {
  vi.clearAllMocks();
  persist.mockResolvedValue(true);
  persisted.mockResolvedValue(false);
  stubStorageManager({ persist, persisted });
  // Reset the stores first: a store change writes its localStorage key.
  useBookmarkStore.setState({ bookmarks: [], collections: [] });
  useProgressStore.setState({ surahsVisited: [] });
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("PersistentStorageRequest", () => {
  it("does not ask while nothing is saved", async () => {
    render(<PersistentStorageRequest />);
    await act(async () => {});
    expect(persisted).not.toHaveBeenCalled();
    expect(persist).not.toHaveBeenCalled();
  });

  it("asks once the first bookmark is saved, and only once", async () => {
    render(<PersistentStorageRequest />);
    act(() => useBookmarkStore.getState().addBookmark(1, 1, "Al-Fatiha", "x"));
    await waitFor(() => expect(persist).toHaveBeenCalledTimes(1));
    act(() => useBookmarkStore.getState().addBookmark(1, 2, "Al-Fatiha", "y"));
    act(() => useProgressStore.getState().addSurahVisited(2));
    await act(async () => {});
    expect(persist).toHaveBeenCalledTimes(1);
  });

  it("asks once progress is saved", async () => {
    render(<PersistentStorageRequest />);
    act(() => useProgressStore.getState().addSurahVisited(1));
    await waitFor(() => expect(persist).toHaveBeenCalledTimes(1));
  });

  it("asks on load when data was saved in an earlier visit", async () => {
    localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify({ state: { bookmarks: [] }, version: 1 }));
    render(<PersistentStorageRequest />);
    await waitFor(() => expect(persist).toHaveBeenCalledTimes(1));
  });

  it("does not ask again when storage is already persistent", async () => {
    persisted.mockResolvedValue(true);
    localStorage.setItem(BOOKMARK_STORAGE_KEY, "{}");
    render(<PersistentStorageRequest />);
    await waitFor(() => expect(persisted).toHaveBeenCalled());
    await act(async () => {});
    expect(persist).not.toHaveBeenCalled();
  });

  it("does nothing without the Storage API", async () => {
    stubStorageManager(undefined);
    localStorage.setItem(BOOKMARK_STORAGE_KEY, "{}");
    expect(() => render(<PersistentStorageRequest />)).not.toThrow();
  });

  it("logs a warning when the request fails", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    persist.mockRejectedValue(new Error("blocked"));
    localStorage.setItem(BOOKMARK_STORAGE_KEY, "{}");
    render(<PersistentStorageRequest />);
    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith("Could not request persistent storage", expect.any(Error)),
    );
  });
});
