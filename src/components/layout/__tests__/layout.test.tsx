/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { AppShell } from "../AppShell";
import { Header } from "../Header";
import { Footer } from "../Footer";
import { MobileNav } from "../MobileNav";
import { SettingsOpenProvider } from "@/contexts/SettingsOpenContext";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/store/playerStore", () => {
  const state = {
    activeAudioSrc: "https://example.com/audio.mp3",
    currentSurahId: "1",
    currentAyahId: "1:1",
    isPlaying: false,
    currentTime: 0,
    duration: 10,
    resume: () => {},
    pause: () => {},
    next: () => {},
    previous: () => {},
    setCurrentTime: () => {},
    setDuration: () => {},
  };
  const usePlayerStoreMock = vi.fn((sel: (s: unknown) => unknown) => sel(state));
  (usePlayerStoreMock as { getState: () => typeof state }).getState = () => state;
  return { usePlayerStore: usePlayerStoreMock };
});

vi.mock("@/lib/audio/audioManager", () => ({
  loadAudio: () => {},
  play: () => {},
  pause: () => {},
  seek: () => {},
  getCurrentTime: () => 0,
  getDuration: () => 10,
  setPlaybackRate: () => {},
  onTimeUpdate: () => () => {},
  onEnded: () => () => {},
}));

vi.mock("@/store/settingsStore", () => ({
  useSettingsStore: vi.fn((sel: (s: unknown) => unknown) =>
    sel({
      repeatMode: "off",
      autoPlayNext: true,
      playbackSpeed: 1,
      cycleRepeatMode: () => {},
      toggleAutoPlayNext: () => {},
    })
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  cleanup();
  document.body.innerHTML = "";
});

describe("AppShell", () => {
  it("renders children", () => {
    render(
      <AppShell>
        <div data-testid="main-content">Page content</div>
      </AppShell>
    );
    expect(screen.getByTestId("main-content")).toHaveTextContent("Page content");
  });

  it("includes Header", () => {
    render(<AppShell><span>x</span></AppShell>);
    expect(screen.getByRole("banner")).toBeInTheDocument();
  });

  it("includes Footer", () => {
    render(<AppShell><span>x</span></AppShell>);
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("includes an audio player region", () => {
    render(<AppShell><span>x</span></AppShell>);
    const player = document.querySelector('[data-testid="audio-player"]');
    expect(player).toBeInTheDocument();
  });

  it("when audio player is visible and user scrolled, BackToTop sits above player (data-above-player)", async () => {
    let scrollY = 500;
    const { container } = render(<AppShell><span>x</span></AppShell>);
    const scrollEl = container.querySelector("[data-scroll-container]");
    if (scrollEl) {
      Object.defineProperty(scrollEl, "scrollTop", {
        configurable: true,
        get: () => scrollY,
        set: (v: number) => { scrollY = v; },
      });
      fireEvent.scroll(scrollEl);
    } else {
      Object.defineProperty(window, "scrollY", { configurable: true, get: () => scrollY });
      fireEvent.scroll(window);
    }
    await waitFor(() => {
      const btn = container.querySelector("[data-testid='back-to-top']");
      expect(btn).toBeInTheDocument();
    }, { timeout: 1000 });
    const btn = container.querySelector("[data-testid='back-to-top']");
    expect(btn).toHaveAttribute("data-above-player", "true");
  });

  it("main content wrapper allows page-level max-width (wider than max-w-2xl)", () => {
    const { container } = render(
      <AppShell>
        <div data-testid="page-root" className="mx-auto max-w-[800px]">Page</div>
      </AppShell>
    );
    const main = container.querySelector("main");
    expect(main).toBeInTheDocument();
    const wrapper = main?.querySelector("div.mx-auto");
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).not.toHaveClass("max-w-2xl");
    expect(wrapper?.className).toMatch(/max-w-7xl/);
  });

  it("on mobile when audio is visible main has extra bottom padding so content is not under audio bar", () => {
    const { container } = render(
      <AppShell>
        <span>Content</span>
      </AppShell>
    );
    const main = container.querySelector("main");
    expect(main).toBeInTheDocument();
    expect(main?.className).toMatch(/max-md:pb-\[126px\]/);
  });
});

describe("Header", () => {
  it("shows app name or logo", () => {
    render(<SettingsOpenProvider><Header /></SettingsOpenProvider>);
    const link = screen.getByRole("link", { name: /quran learning/i });
    expect(link).toBeInTheDocument();
  });

  it("has Surahs link", () => {
    render(<SettingsOpenProvider><Header /></SettingsOpenProvider>);
    expect(screen.getByRole("link", { name: /surahs/i })).toHaveAttribute("href", "/surahs");
  });

  it("has Quiz link", () => {
    render(<SettingsOpenProvider><Header /></SettingsOpenProvider>);
    expect(screen.getByRole("link", { name: /quiz/i })).toHaveAttribute("href", "/test/1");
  });

  it("has Search link", () => {
    render(<SettingsOpenProvider><Header /></SettingsOpenProvider>);
    expect(screen.getByRole("link", { name: /pretraga/i })).toHaveAttribute("href", "/search");
  });

  it("has Bookmarks link", () => {
    render(<SettingsOpenProvider><Header /></SettingsOpenProvider>);
    const links = screen.getAllByRole("link", { name: /bookmarks|označeni ajeti/i });
    expect(links.length).toBeGreaterThanOrEqual(1);
    expect(links.some((el) => (el as HTMLAnchorElement).getAttribute("href") === "/bookmarks")).toBe(true);
  });

  it("has Progress link", () => {
    render(<SettingsOpenProvider><Header /></SettingsOpenProvider>);
    expect(screen.getByRole("link", { name: /progress/i })).toHaveAttribute("href", "/progress");
  });

  it("has settings control", () => {
    render(<SettingsOpenProvider><Header /></SettingsOpenProvider>);
    const settings = screen.getByRole("button", { name: /settings/i });
    expect(settings).toBeInTheDocument();
  });

  it("has distinct brand and navigation sections", () => {
    const { container } = render(<SettingsOpenProvider><Header /></SettingsOpenProvider>);
    const header = container.querySelector("header[role='banner']");
    const inner = header?.firstElementChild;
    expect(inner).toBeInTheDocument();
    // Two main groups: brand (flex-1) and nav
    const children = inner?.children ?? [];
    expect(children.length).toBeGreaterThanOrEqual(2);
    const nav = header?.querySelector("nav[aria-label='Main navigation']");
    expect(nav).toBeInTheDocument();
  });

  it("nav has spacing between items", () => {
    const { container } = render(<SettingsOpenProvider><Header /></SettingsOpenProvider>);
    const nav = container.querySelector("nav[aria-label='Main navigation']");
    expect(nav).toBeInTheDocument();
    expect(nav?.className).toMatch(/gap-/);
  });

  it("uses separators or grouping for visual distinction on desktop", () => {
    const { container } = render(<SettingsOpenProvider><Header /></SettingsOpenProvider>);
    const nav = container.querySelector("nav[aria-label='Main navigation']");
    expect(nav).toBeInTheDocument();
    const hasSeparator = !!nav?.querySelector("[role='separator']");
    const hasMultipleGroups = (nav?.children.length ?? 0) >= 2;
    expect(hasSeparator || hasMultipleGroups).toBe(true);
  });
});

describe("Footer", () => {
  it("has About link", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: /about/i })).toBeInTheDocument();
  });

  it("has Contact link", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: /contact/i })).toBeInTheDocument();
  });

  it("has Sources link", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: /sources/i })).toBeInTheDocument();
  });

  it("has Privacy link", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: /privacy/i })).toBeInTheDocument();
  });
});

describe("MobileNav", () => {
  it("renders and is accessible", () => {
    render(<SettingsOpenProvider><MobileNav /></SettingsOpenProvider>);
    const nav = screen.getByRole("navigation", { name: /mobile/i });
    expect(nav).toBeInTheDocument();
  });

  it("includes Home, Learn, Sure, Više and Progress (search, bookmarks and settings are in header)", () => {
    render(<SettingsOpenProvider><MobileNav /></SettingsOpenProvider>);
    expect(screen.getByRole("link", { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /učenje/i })).toHaveAttribute("href", "/learn/1");
    expect(screen.getByRole("link", { name: /^sure$/i })).toHaveAttribute("href", "/surahs");
    expect(screen.getByRole("button", { name: /više/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /progress/i })).toHaveAttribute("href", "/progress");
    expect(screen.queryByRole("link", { name: /pretraga/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /označeno/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /postavke/i })).not.toBeInTheDocument();
  });

  it("Više button opens menu with Kviz and Tajwid lekcije", async () => {
    render(<SettingsOpenProvider><MobileNav /></SettingsOpenProvider>);
    const moreBtn = screen.getByRole("button", { name: /više/i });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    const user = (await import("@testing-library/user-event")).default;
    await user.click(moreBtn);
    const menu = screen.getByRole("menu", { name: /više opcija/i });
    expect(menu).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /kviz/i })).toHaveAttribute("href", "/test/1");
    expect(screen.getByRole("menuitem", { name: /tajwid lekcije/i })).toHaveAttribute("href", "/tajwid");
  });
});
