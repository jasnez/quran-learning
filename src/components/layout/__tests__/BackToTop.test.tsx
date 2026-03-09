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

  describe("position above sticky player", () => {
    it("when sticky player is visible, button has data-above-player true and sits above player", async () => {
      playerStoreState = mockPlayerStore(true);
      scrollY = 500;
      render(<BackToTop scrollThreshold={SCROLL_THRESHOLD} />);
      fireEvent.scroll(window);
      await waitFor(() => {
        expect(screen.getByTestId("back-to-top")).toBeInTheDocument();
      });
      const btn = screen.getByTestId("back-to-top");
      expect(btn).toHaveAttribute("data-above-player", "true");
      expect(btn.className).toMatch(/bottom-\[8\.5rem\]|bottom-24|md:bottom-24/);
    });

    it("when sticky player is not visible, button has data-above-player false and default position", async () => {
      playerStoreState = mockPlayerStore(false);
      scrollY = 500;
      render(<BackToTop scrollThreshold={SCROLL_THRESHOLD} />);
      fireEvent.scroll(window);
      await waitFor(() => {
        expect(screen.getByTestId("back-to-top")).toBeInTheDocument();
      });
      const btn = screen.getByTestId("back-to-top");
      expect(btn).toHaveAttribute("data-above-player", "false");
      expect(btn.className).toMatch(/max-md:bottom-24|md:bottom-8/);
    });
  });
});
