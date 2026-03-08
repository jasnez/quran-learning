/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
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
}));

vi.mock("@/store/playerStore", () => ({
  usePlayerStore: vi.fn((sel: (s: unknown) => unknown) =>
    sel({
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
    })
  ),
}));

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
      repeatAyah: false,
      autoPlayNext: true,
      playbackSpeed: 1,
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
});

describe("Header", () => {
  it("shows app name or logo", () => {
    render(<SettingsOpenProvider><Header /></SettingsOpenProvider>);
    const link = screen.getByRole("link", { name: /quran learning/i });
    expect(link).toBeInTheDocument();
  });

  it("has Home link", () => {
    render(<SettingsOpenProvider><Header /></SettingsOpenProvider>);
    const homeLink = screen.getByRole("link", { name: /^home$/i });
    expect(homeLink).toHaveAttribute("href", "/");
  });

  it("has Surahs link", () => {
    render(<SettingsOpenProvider><Header /></SettingsOpenProvider>);
    expect(screen.getByRole("link", { name: /surahs/i })).toHaveAttribute("href", "/surahs");
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

  it("has settings control", () => {
    render(<SettingsOpenProvider><Header /></SettingsOpenProvider>);
    const settings = screen.getByRole("button", { name: /settings/i });
    expect(settings).toBeInTheDocument();
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

  it("includes Home, Learn, Sure, Bookmarks and Settings", () => {
    render(<SettingsOpenProvider><MobileNav /></SettingsOpenProvider>);
    expect(screen.getByRole("link", { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /pretraga/i })).toHaveAttribute("href", "/search");
    expect(screen.getByRole("link", { name: /učenje/i })).toHaveAttribute("href", "/learn/1");
    expect(screen.getByRole("link", { name: /^sure$/i })).toHaveAttribute("href", "/surahs");
    expect(screen.getByRole("link", { name: /označeno/i })).toHaveAttribute("href", "/bookmarks");
    expect(screen.getByRole("button", { name: /postavke/i })).toBeInTheDocument();
  });
});
