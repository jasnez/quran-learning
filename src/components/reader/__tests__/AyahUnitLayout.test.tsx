/**
 * @vitest-environment jsdom
 *
 * AyahUnit (Phase 4, D4): an ayah flows as text with a rosette, not as a card. The card variant
 * is for a single ayah on its own (a dua, a search result).
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within, cleanup } from "@testing-library/react";
import type { Ayah } from "@/types/quran";
import { AyahUnit } from "../AyahUnit";

const playerState = vi.hoisted(() => ({
  currentAyahId: null as string | null,
  isPlaying: false,
  activeAudioSrc: null as string | null,
  currentTimeMs: 0,
  setQueue: vi.fn(),
  play: vi.fn(),
  pause: vi.fn(),
}));
const bookmarkState = vi.hoisted(() => ({
  bookmarks: [] as { id: string; surahNumber: number; ayahNumber: number }[],
  toggleBookmark: vi.fn(),
}));

vi.mock("@/store/playerStore", () => {
  const m = vi.fn((sel: (s: unknown) => unknown) => sel(playerState));
  (m as { getState?: () => typeof playerState }).getState = () => playerState;
  return { usePlayerStore: m };
});
vi.mock("@/store/bookmarkStore", async (importOriginal) => ({
  hasBookmark: (await importOriginal<typeof import("@/store/bookmarkStore")>()).hasBookmark,
  useBookmarkStore: vi.fn((sel: (s: unknown) => unknown) => sel(bookmarkState)),
}));
vi.mock("@/store/toastStore", () => ({
  useToastStore: vi.fn((sel: (s: unknown) => unknown) => sel({ showToast: vi.fn() })),
}));
vi.mock("@/store/progressStore", () => {
  const state = { markAyahRead: vi.fn(), updateLastPosition: vi.fn() };
  const m = vi.fn((sel: (s: unknown) => unknown) => sel(state));
  (m as { getState?: () => typeof state }).getState = () => state;
  return { useProgressStore: m };
});
vi.mock("@/hooks/useMediaQuery", () => ({ useIsMobile: vi.fn(() => false) }));
vi.mock("@/lib/audio/audioManager", () => ({ play: () => Promise.resolve(), pause: () => {}, seek: () => {} }));

// Fixture text, as in accessibleNames.test.tsx; the Latin lines are placeholders.
const ayah: Ayah = {
  id: "1:5",
  ayahNumber: 5,
  ayahNumberGlobal: 5,
  juz: 1,
  page: 3,
  arabicText: "بِسْمِ",
  transliteration: "transkripcija ajeta",
  translationBosnian: "prijevod ajeta",
  tajwidSegments: [{ text: "بِسْمِ", rule: "normal" }],
  audio: { reciterId: "mishary-alafasy", url: "", durationMs: 0 },
};

const props = (extra: Record<string, unknown> = {}) => ({
  ayah,
  queueAyahs: [ayah],
  surahNameLatin: "El-Fātiḥa",
  arabicFontSize: 28,
  showTransliteration: true,
  showTranslation: true,
  showTajwidColors: true,
  ...extra,
});

beforeEach(() => {
  vi.clearAllMocks();
  playerState.currentAyahId = null;
  playerState.isPlaying = false;
  bookmarkState.bookmarks = [];
});
afterEach(cleanup);

describe("AyahUnit, flow variant", () => {
  it("is separated by a line and has no card look and no two-column grid", () => {
    render(<AyahUnit {...props()} />);
    const article = screen.getByRole("article", { name: "5. ajet" });
    expect(article).toHaveClass("border-t", "border-line", "py-5");
    expect(article.className).not.toMatch(/rounded-xl|rounded-card|bg-surface\b|grid-cols/);
    expect(article.querySelector('[class*="grid-cols"]')).toBeNull();
  });

  it("is named by a visually hidden element, and keeps the anchors other parts rely on", () => {
    render(<AyahUnit {...props()} />);
    const article = screen.getByRole("article", { name: "5. ajet" });
    expect(article).toHaveAttribute("id", "ayah-1-5");
    expect(article).toHaveAttribute("data-ayah-id", "1:5");
    const name = article.querySelector("#ayah-number-1-5");
    expect(name).toHaveClass("sr-only");
    expect(name).toHaveTextContent("5. ajet");
  });

  it("ends the Arabic text with the rosette of its number, hidden from screen readers", () => {
    render(<AyahUnit {...props()} />);
    const arabic = screen.getByRole("article").querySelector('p[lang="ar"]')!;
    const rosette = arabic.lastElementChild!;
    expect(rosette).toHaveAttribute("data-rosette");
    expect(rosette).toHaveAttribute("aria-hidden", "true");
    expect(rosette).toHaveTextContent("5");
    expect(rosette).not.toHaveAttribute("data-filled");
  });

  it("sets the Arabic right aligned and the Latin lines left aligned, in that order", () => {
    render(<AyahUnit {...props()} />);
    const article = screen.getByRole("article");
    expect(article.querySelector('p[lang="ar"]')).toHaveClass("text-right");
    expect(screen.getByText("transkripcija ajeta")).toHaveClass("text-left");
    const translation = screen.getByText("prijevod ajeta");
    expect(translation).toHaveClass("text-left", "max-w-[42rem]");
    expect(translation.className).not.toMatch(/text-center/);
  });

  it("has its actions under the text: play and save, each a 44 px target", () => {
    render(<AyahUnit {...props()} />);
    const article = screen.getByRole("article");
    const translation = screen.getByText("prijevod ajeta");
    const play = within(article).getByRole("button", { name: "Pusti 5. ajet" });
    const save = within(article).getByRole("button", { name: "Sačuvaj 5. ajet" });
    expect(translation.compareDocumentPosition(play) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    for (const button of [play, save]) expect(button).toHaveClass("h-11", "w-11");
  });

  it("shows the mushaf page only where a page starts", () => {
    const { rerender } = render(<AyahUnit {...props()} />);
    expect(screen.queryByText("str. 3")).toBeNull();
    rerender(<AyahUnit {...props({ showPageBadge: true })} />);
    expect(screen.getByText("str. 3")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("Stranica 3")).toHaveClass("sr-only");
  });

  it("while it plays: highlight, filled rosette, a pause button and the words that say so", () => {
    playerState.currentAyahId = "1:5";
    playerState.isPlaying = true;
    render(<AyahUnit {...props()} />);
    const article = screen.getByRole("article", { name: "5. ajet" });
    expect(article).toHaveClass("bg-highlight", "rounded-xl");
    expect(article).toHaveAttribute("data-active", "true");
    expect(article.querySelector("[data-rosette]")).toHaveAttribute("data-filled", "true");
    expect(within(article).getByRole("button", { name: "Pauziraj 5. ajet" })).toBeInTheDocument();
    expect(within(article).getByText("Sluša se")).toBeInTheDocument();
  });

  it("does not say it plays when another ayah does", () => {
    playerState.currentAyahId = "1:6";
    playerState.isPlaying = true;
    render(<AyahUnit {...props()} />);
    expect(screen.queryByText("Sluša se")).toBeNull();
    expect(screen.getByRole("article")).not.toHaveClass("bg-highlight");
  });

  it("moves with the sheet duration token and does not scale its buttons", () => {
    render(<AyahUnit {...props()} />);
    const article = screen.getByRole("article");
    expect(article).toHaveClass("transition-colors", "duration-sheet");
    expect(article.innerHTML).not.toMatch(/scale-/);
  });
});

describe("AyahUnit, card variant", () => {
  it("is a card: border, surface and the card radius", () => {
    render(<AyahUnit {...props({ variant: "card" })} />);
    const article = screen.getByRole("article", { name: "5. ajet" });
    expect(article).toHaveClass("rounded-card", "border", "border-line", "bg-surface");
    expect(article).not.toHaveClass("border-t");
  });
});
