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
import { render, act, screen, within, fireEvent, cleanup } from "@testing-library/react";
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

describe("InstallPrompt on iOS Safari", () => {
  const IOS_UA =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
  // Built from code points: no emoji literal in the source.
  const EMOJI = new RegExp(`[${String.fromCodePoint(0x1f300)}-${String.fromCodePoint(0x1faff)}]`, "u");

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.spyOn(window.navigator, "userAgent", "get").mockReturnValue(IOS_UA);
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      media: "",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }) as unknown as typeof window.matchMedia;
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function showBanner() {
    render(<InstallPrompt />);
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
  }

  it("shows the banner as a complementary landmark, not a dialog", () => {
    showBanner();
    expect(screen.getByRole("complementary", { name: "Instaliraj aplikaciju" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.getByText("Otvara se s početnog ekrana; preuzete sure rade i bez interneta."),
    ).toBeInTheDocument();
  });

  it("Instaliraj opens a native dialog with the three steps and a share icon, no emoji", () => {
    showBanner();
    fireEvent.click(screen.getByRole("button", { name: "Instaliraj" }));
    const dialog = screen.getByRole("dialog", { name: "Dodaj na iPhone" });
    expect(dialog.tagName).toBe("DIALOG");
    expect(dialog).not.toHaveAttribute("aria-modal");
    const steps = within(dialog).getAllByRole("listitem");
    expect(steps).toHaveLength(3);
    expect(steps[0]).toHaveTextContent(/Dodirni ikonu za dijeljenje\s+u Safariju\./);
    expect(steps[1]).toHaveTextContent(
      "Izaberi „Dodaj na početni zaslon“ (engleski: „Add to Home Screen“).",
    );
    expect(steps[2]).toHaveTextContent("Dodirni „Dodaj“ gore desno.");
    expect(steps[0].querySelector("svg")).toBeInTheDocument();
    expect(dialog.textContent).not.toMatch(EMOJI);
  });

  it("Razumijem closes only the steps; the banner stays and nothing is stored", () => {
    showBanner();
    fireEvent.click(screen.getByRole("button", { name: "Instaliraj" }));
    fireEvent.click(screen.getByRole("button", { name: "Razumijem" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Instaliraj aplikaciju" })).toBeInTheDocument();
    expect(localStorage.getItem(DISMISSED_KEY)).toBeNull();
  });

  it("a native close (Esc or backdrop) also closes only the steps", () => {
    showBanner();
    fireEvent.click(screen.getByRole("button", { name: "Instaliraj" }));
    const dialog = screen.getByRole("dialog", { name: "Dodaj na iPhone" }) as HTMLDialogElement;
    // The browser closes the dialog itself and fires "close"; jsdom's polyfill does the same.
    act(() => dialog.close());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Instaliraj aplikaciju" })).toBeInTheDocument();
    expect(localStorage.getItem(DISMISSED_KEY)).toBeNull();
  });

  it("the banner's Zatvori stores the dismissal and hides the banner", () => {
    showBanner();
    fireEvent.click(screen.getByRole("button", { name: "Zatvori" }));
    expect(localStorage.getItem(DISMISSED_KEY)).not.toBeNull();
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  });
});
