/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { BackToTop } from "../BackToTop";

const SCROLL_THRESHOLD = 400;

const mockPlayerStore = (hasAudio: boolean) => ({
  activeAudioSrc: hasAudio ? "/audio/001001.mp3" : null,
});
let playerStoreState = mockPlayerStore(false);

vi.mock("@/store/playerStore", () => ({
  usePlayerStore: vi.fn((selector: (s: { activeAudioSrc: string | null }) => unknown) =>
    selector({ activeAudioSrc: playerStoreState.activeAudioSrc })
  ),
}));

describe("BackToTop", () => {
  let scrollY = 0;
  const scrollToMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
    document.body.innerHTML = "";
    scrollY = 0;
    playerStoreState = mockPlayerStore(false);
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      get: () => scrollY,
    });
    Object.defineProperty(window, "scrollTo", {
      configurable: true,
      value: scrollToMock,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a button with accessible label (Povratak na vrh / Back to top)", async () => {
    scrollY = 500;
    render(<BackToTop scrollThreshold={SCROLL_THRESHOLD} />);
    fireEvent.scroll(window);
    await waitFor(() => {
      expect(screen.getByTestId("back-to-top")).toBeInTheDocument();
    });
    expect(screen.getByTestId("back-to-top")).toHaveAttribute("aria-label", "Povratak na vrh stranice");
  });

  it("hides button when scroll position is below threshold", () => {
    scrollY = 100;
    render(<BackToTop scrollThreshold={SCROLL_THRESHOLD} />);
    fireEvent.scroll(window);
    expect(screen.queryByTestId("back-to-top")).not.toBeInTheDocument();
  });

  it("shows button when scroll position is above threshold", async () => {
    scrollY = 500;
    render(<BackToTop scrollThreshold={SCROLL_THRESHOLD} />);
    fireEvent.scroll(window);
    await waitFor(() => {
      expect(screen.getByTestId("back-to-top")).toBeInTheDocument();
    });
  });

  it("on click scrolls to top with smooth behavior", async () => {
    scrollY = 500;
    render(<BackToTop scrollThreshold={SCROLL_THRESHOLD} />);
    fireEvent.scroll(window);
    await waitFor(() => {
      expect(screen.getByTestId("back-to-top")).toBeInTheDocument();
    });
    const btn = screen.getByTestId("back-to-top");
    fireEvent.click(btn);
    expect(scrollToMock).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });

  it("button has data-testid for targeting", async () => {
    scrollY = 500;
    render(<BackToTop scrollThreshold={SCROLL_THRESHOLD} />);
    fireEvent.scroll(window);
    await waitFor(() => {
      expect(screen.getByTestId("back-to-top")).toBeInTheDocument();
    });
  });

  describe("position above the bottom bars", () => {
    it.each([true, false])("sits one gap above the bars from CSS alone (player loaded: %s)", async (hasAudio) => {
      playerStoreState = mockPlayerStore(hasAudio);
      scrollY = 500;
      render(<BackToTop scrollThreshold={SCROLL_THRESHOLD} />);
      fireEvent.scroll(window);
      await waitFor(() => {
        expect(screen.getByTestId("back-to-top")).toBeInTheDocument();
      });
      const btn = screen.getByTestId("back-to-top");
      // --bars-bottom counts the tab bar and the player; the button itself asks nobody.
      expect(btn).toHaveClass("bottom-[calc(var(--bars-bottom)+1rem)]");
      expect(btn).not.toHaveAttribute("data-above-player");
    });

    it("does not subscribe to the player store", async () => {
      const { usePlayerStore } = await import("@/store/playerStore");
      vi.mocked(usePlayerStore).mockClear();
      render(<BackToTop scrollThreshold={SCROLL_THRESHOLD} />);
      expect(usePlayerStore).not.toHaveBeenCalled();
    });
  });
});
