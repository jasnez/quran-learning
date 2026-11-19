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

// AudioPlayer i SettingsPanel su dynamic imports — mock them synchronously
vi.mock("@/components/audio/AudioPlayer", () => ({
  AudioPlayer: () => (
    <div data-testid="audio-player" role="region" aria-label="Audio player" />
  ),
}));
vi.mock("@/components/settings/SettingsPanel", () => ({
  SettingsPanel: () => null,
}));

// next/dynamic: koristi React.lazy + Suspense; act() unutar render() fleša microtaskove
vi.mock("next/dynamic", () => ({
  default: (
    importFn: () => Promise<{ default: React.ComponentType<Record<string, unknown>> }>
  ) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const R = require("react") as typeof import("react");
    const LazyComp = R.lazy(() => importFn());
    return function DynamicStub(props: Record<string, unknown>) {
      return R.createElement(
        R.Suspense,
        { fallback: null },
        R.createElement(LazyComp, props)
      );
    };
  },
}));

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
  useSelectedLayoutSegment: () => null,
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
  (usePlayerStoreMock as unknown as { getState: () => typeof state }).getState = () => state;
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
  onDurationChange: () => () => {},
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
    render(
      <AppShell>
        <span>x</span>
      </AppShell>
    );
    expect(screen.getByRole("banner")).toBeInTheDocument();
  });

  it("renders Footer inside AppShell as part of page layout", () => {
    render(
      <AppShell>
        <span>x</span>
      </AppShell>
    );
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("scroll container is flex column with min height for sticky footer", () => {
    const { container } = render(
      <AppShell>
        <span>x</span>
      </AppShell>
    );
    const scrollEl = container.querySelector("[data-scroll-container]");
    expect(scrollEl).toBeInTheDocument();
    expect(scrollEl?.className).toMatch(/flex.*flex-col|flex-col/);
    expect(scrollEl?.className).toMatch(/min-h-screen|min-h-dvh/);
  });

  it("app wrapper is not a scroll container, so sticky descendants stick to the viewport (QA P1-3)", () => {
    const { container } = render(
      <AppShell>
        <span>x</span>
      </AppShell>
    );
    const scrollEl = container.querySelector("[data-scroll-container]");
    // overflow hidden/auto/scroll (any axis) creates a scroll container and
    // breaks position: sticky; overflow-x: clip does not.
    expect(scrollEl?.className).not.toMatch(/\boverflow(-[xy])?-(hidden|auto|scroll)\b/);
  });

  it("main has flex-1 so footer sits at bottom when content is short", () => {
    const { container } = render(
      <AppShell>
        <span>x</span>
      </AppShell>
    );
    const main = container.querySelector("main");
    expect(main?.className).toMatch(/flex-1/);
  });

  it("Footer is rendered after main in DOM order", () => {
    const { container } = render(
      <AppShell>
        <span>x</span>
      </AppShell>
    );
    const main = container.querySelector("main");
    const footer = container.querySelector("footer[role='contentinfo']");
    expect(main).toBeInTheDocument();
    expect(footer).toBeInTheDocument();
    const mainNext = main?.nextElementSibling;
    expect(mainNext).toBe(footer);
  });

  it("main has bottom padding for spacing before footer (40px mobile, 64px desktop)", () => {
    const { container } = render(
      <AppShell>
        <span>Content</span>
      </AppShell>
    );
    const main = container.querySelector("main");
    expect(main).toBeInTheDocument();
    expect(main?.className).toMatch(/md:pb-16|md:pb-\[64px\]/);
    expect(main?.className).toMatch(/pb-10|pb-\[40px\]|max-md:pb-\[126px\]/);
  });

  it("includes an audio player region", async () => {
    render(<AppShell><span>x</span></AppShell>);
    await waitFor(() => {
      expect(document.querySelector('[data-testid="audio-player"]')).toBeInTheDocument();
    });
  });

  it("when audio player is visible and user scrolled, BackToTop sits above player (data-above-player)", async () => {
    const scrollY = 500;
    Object.defineProperty(window, "scrollY", { configurable: true, get: () => scrollY });
    const { container } = render(<AppShell><span>x</span></AppShell>);
    fireEvent.scroll(window);
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

  // QA section 5: the clearance sat on <main>, so the footer after it stayed under the fixed
  // bottom navigation (and under the player too). It belongs below the footer.
  it("with audio, the page ends with room for the fixed bottom bars below the footer", () => {
    const { container } = render(
      <AppShell>
        <span>Content</span>
      </AppShell>
    );
    const scrollEl = container.querySelector("[data-scroll-container]");
    const main = container.querySelector("main");
    // mobile: bottom navigation (56px) + player (70px); desktop: player only
    expect(scrollEl).toHaveClass("max-md:pb-[126px]", "md:pb-[70px]");
    expect(main?.className).not.toMatch(/max-md:pb-\[126px\]/);
  });

  it("main has bottom padding so content clears bottom UI", () => {
    const { container } = render(
      <AppShell>
        <span>Content</span>
      </AppShell>
    );
    const main = container.querySelector("main");
    expect(main).toBeInTheDocument();
    // At least 4rem (64px) or more for footer / controls clearance on desktop
    expect(main?.className).toMatch(/pb-24|pb-\[96px\]|pb-32|pb-20|pb-16|pb-10/);
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
    expect(screen.getByRole("link", { name: /^sure$/i })).toHaveAttribute("href", "/surahs");
  });

  it("does not have separate Džuzevi link in header (accessible via Sure page tabs)", () => {
    render(<SettingsOpenProvider><Header /></SettingsOpenProvider>);
    expect(screen.queryByRole("link", { name: /džuzevi/i })).not.toBeInTheDocument();
  });

  it("names the play button Pusti, and Pauziraj while playing", async () => {
    const { usePlayerStore } = await import("@/store/playerStore");
    const state = usePlayerStore.getState() as { isPlaying: boolean };
    const { unmount } = render(<SettingsOpenProvider><Header /></SettingsOpenProvider>);
    expect(screen.getByRole("button", { name: "Pusti" })).toBeInTheDocument();
    unmount();
    state.isPlaying = true;
    try {
      render(<SettingsOpenProvider><Header /></SettingsOpenProvider>);
      expect(screen.getByRole("button", { name: "Pauziraj" })).toBeInTheDocument();
    } finally {
      state.isPlaying = false;
    }
  });

  it("names the Učenje menu button after what it holds", () => {
    render(<SettingsOpenProvider><Header /></SettingsOpenProvider>);
    expect(
      screen.getByRole("button", { name: "Učenje: tedžvid, harfovi i Allahova imena" })
    ).toBeInTheDocument();
  });

  it("Učenje dropdown offers lessons and names but not the quiz, which is hidden for now", async () => {
    render(<SettingsOpenProvider><Header /></SettingsOpenProvider>);
    const ucenjeBtn = screen.getByRole("button", { name: /učenje/i });
    const user = (await import("@testing-library/user-event")).default.setup();
    await user.click(ucenjeBtn);
    expect(screen.getByRole("link", { name: /tedžvid lekcije/i })).toHaveAttribute("href", "/tajwid");
    expect(screen.getByRole("link", { name: /allahova lijepa imena/i })).toHaveAttribute("href", "/names");
    expect(screen.getByRole("link", { name: /harfovi i izgovor/i })).toHaveAttribute("href", "/harfovi");
    expect(screen.queryByRole("link", { name: /kviz/i })).not.toBeInTheDocument();
  });

  it("has Kur'anske dove dropdown with category links", async () => {
    render(<SettingsOpenProvider><Header /></SettingsOpenProvider>);
    const duasBtns = screen.getAllByRole("button", { name: /kur'anske dove/i });
    expect(duasBtns.length).toBeGreaterThanOrEqual(1);
    const user = (await import("@testing-library/user-event")).default.setup();
    await user.click(duasBtns[0]);
    expect(screen.getByRole("link", { name: /rabbena dove/i })).toHaveAttribute("href", "/duas/rabbana");
    expect(screen.getByRole("link", { name: /za oprost/i })).toHaveAttribute("href", "/duas/forgiveness");
  });

  it("has Search link", () => {
    render(<SettingsOpenProvider><Header /></SettingsOpenProvider>);
    expect(screen.getByRole("link", { name: /pretraga/i })).toHaveAttribute("href", "/search");
  });

  it("has Bookmarks link", () => {
    render(<SettingsOpenProvider><Header /></SettingsOpenProvider>);
    const links = screen.getAllByRole("link", { name: /sačuvani ajeti/i });
    expect(links.length).toBeGreaterThanOrEqual(1);
    expect(links.some((el) => (el as HTMLAnchorElement).getAttribute("href") === "/bookmarks")).toBe(true);
  });

  it("has Progress link", () => {
    render(<SettingsOpenProvider><Header /></SettingsOpenProvider>);
    expect(screen.getByRole("link", { name: /napredak/i })).toHaveAttribute("href", "/progress");
  });

  it("has settings control", () => {
    render(<SettingsOpenProvider><Header /></SettingsOpenProvider>);
    const settings = screen.getByRole("button", { name: /postavke/i });
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
    const nav = header?.querySelector("nav[aria-label='Glavna navigacija']");
    expect(nav).toBeInTheDocument();
  });

  it("nav has spacing between items", () => {
    const { container } = render(<SettingsOpenProvider><Header /></SettingsOpenProvider>);
    const nav = container.querySelector("nav[aria-label='Glavna navigacija']");
    expect(nav).toBeInTheDocument();
    expect(nav?.className).toMatch(/gap-/);
  });

  it("uses separators or grouping for visual distinction on desktop", () => {
    const { container } = render(<SettingsOpenProvider><Header /></SettingsOpenProvider>);
    const nav = container.querySelector("nav[aria-label='Glavna navigacija']");
    expect(nav).toBeInTheDocument();
    const hasSeparator = !!nav?.querySelector("[role='separator']");
    const hasMultipleGroups = (nav?.children.length ?? 0) >= 2;
    expect(hasSeparator || hasMultipleGroups).toBe(true);
  });
});

describe("Footer", () => {
  it("has link Izvori", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: /izvori/i })).toHaveAttribute("href", "/sources");
  });

  it("has link Kontakt", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: /kontakt/i })).toHaveAttribute("href", "/contact");
  });

  it("has link O aplikaciji", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: "O aplikaciji" })).toHaveAttribute("href", "/about");
  });

  it("names its navigation Podnožje", () => {
    render(<Footer />);
    expect(screen.getByRole("navigation", { name: "Podnožje" })).toBeInTheDocument();
  });

  it("shows the app name", () => {
    const { container } = render(<Footer />);
    const footer = container.querySelector("footer[role='contentinfo']");
    expect(footer).toHaveTextContent(/quran learning/i);
  });

  it("shows short description", () => {
    const { container } = render(<Footer />);
    const footer = container.querySelector("footer[role='contentinfo']");
    expect(footer).toHaveTextContent(
      "Kur'an na bosanskom: arapski tekst, transkripcija, Korkutov prijevod i učač Mishary Alafasy."
    );
  });

  it("shows copyright and Sva prava zadržana", () => {
    render(<Footer />);
    expect(screen.getByText(/©\s*2026|2026/i)).toBeInTheDocument();
    expect(screen.getByText(/sva prava zadržana|zadržana/i)).toBeInTheDocument();
  });

  it("is not fixed to the viewport (part of page flow)", () => {
    const { container } = render(<Footer />);
    const footer = container.querySelector("footer[role='contentinfo']");
    expect(footer).toBeInTheDocument();
    expect(footer?.className).not.toMatch(/fixed/);
    expect(footer?.className).not.toMatch(/sticky/);
    expect(footer?.className).not.toMatch(/absolute/);
    expect(footer?.className).not.toMatch(/bottom-0|bottom-\[0\]/);
  });

  it("has top border", () => {
    const { container } = render(<Footer />);
    const footer = container.querySelector("footer[role='contentinfo']");
    expect(footer?.className).toMatch(/border-t/);
  });

  // QA section 5: the links were 20px tall on mobile.
  it("links are at least 44px tall on mobile and 24px on desktop", () => {
    render(<Footer />);
    for (const name of [/izvori/i, /kontakt/i, /o aplikaciji/i]) {
      expect(screen.getByRole("link", { name })).toHaveClass("min-h-11", "md:min-h-6");
    }
  });

  it("does not use mobile bottom offset utility classes", () => {
    const { container } = render(<Footer />);
    const footer = container.querySelector("footer[role='contentinfo']");
    expect(footer).toBeInTheDocument();
    expect(footer?.className).not.toMatch(/max-md:bottom-14|max-md:bottom-\[56px\]/);
  });
});

describe("MobileNav", () => {
  it("renders and is accessible", () => {
    render(<SettingsOpenProvider><MobileNav /></SettingsOpenProvider>);
    const nav = screen.getByRole("navigation", { name: /mobilna navigacija/i });
    expect(nav).toBeInTheDocument();
  });

  it("includes Početna, Sure, Učenje, Dove and Više (search stays in header; bookmarks/settings/napredak moved into Više)", () => {
    render(<SettingsOpenProvider><MobileNav /></SettingsOpenProvider>);
    expect(screen.getByRole("link", { name: /početna/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /^sure$/i })).toHaveAttribute("href", "/surahs");
    expect(screen.getByRole("link", { name: /učenje/i })).toHaveAttribute("href", "/learn/1");
    expect(screen.getByRole("link", { name: /^dove$/i })).toHaveAttribute("href", "/duas");
    expect(screen.getByRole("button", { name: /više/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /napredak/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /pretraga/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /označeno/i })).not.toBeInTheDocument();
  });

  it("Više button opens a list with Bookmarks, Napredak, Postavke and Tedžvid lekcije, without the hidden quiz", async () => {
    render(<SettingsOpenProvider><MobileNav /></SettingsOpenProvider>);
    const moreBtn = screen.getByRole("button", { name: /više/i });
    expect(screen.queryByRole("list", { name: /više opcija/i })).not.toBeInTheDocument();
    const user = (await import("@testing-library/user-event")).default;
    await user.click(moreBtn);
    expect(screen.getByRole("list", { name: /više opcija/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sačuvani ajeti" })).toHaveAttribute("href", "/bookmarks");
    expect(screen.getByRole("link", { name: /napredak/i })).toHaveAttribute("href", "/progress");
    expect(screen.getByRole("button", { name: /postavke/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /kviz/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /tedžvid lekcije/i })).toHaveAttribute("href", "/tajwid");
    expect(screen.getByRole("link", { name: /harfovi i izgovor/i })).toHaveAttribute("href", "/harfovi");
  });
});
