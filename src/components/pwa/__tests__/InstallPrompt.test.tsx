/**
 * @vitest-environment jsdom
 *
 * Note: Only bail-out paths are tested here (initial render + dismissed/installed
 * shortcuts). The beforeinstallprompt event flow and timing-based banner display
 * depend on jsdom navigator/window quirks that don't faithfully match browser
 * behavior — those paths are verified manually in dev.
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, act } from "@testing-library/react";
import { InstallPrompt } from "../InstallPrompt";

const DISMISSED_KEY = "quran-pwa-install-dismissed";
const INSTALLED_KEY = "quran-pwa-install-installed";

describe("InstallPrompt", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders nothing immediately on mount (banner is deferred)", () => {
    const { container } = render(<InstallPrompt />);
    expect(container.firstChild).toBeNull();
  });

  it("stays empty when user recently dismissed", () => {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    const { container } = render(<InstallPrompt />);
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(container.firstChild).toBeNull();
  });

  it("stays empty when app is already marked installed", () => {
    localStorage.setItem(INSTALLED_KEY, "1");
    const { container } = render(<InstallPrompt />);
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(container.firstChild).toBeNull();
  });

  it("stays empty when display-mode is standalone", () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      media: "(display-mode: standalone)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }) as unknown as typeof window.matchMedia;
    const { container } = render(<InstallPrompt />);
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(container.firstChild).toBeNull();
  });
});
