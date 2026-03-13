/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AyahCard } from "../AyahCard";
import { useBookmarkStore } from "@/store/bookmarkStore";
import { useToastStore } from "@/store/toastStore";
import * as authHelpers from "@/lib/auth/authHelpers";
import type { Ayah } from "@/types/quran";

const mockAyah: Ayah = {
  id: "1:1",
  ayahNumber: 1,
  ayahNumberGlobal: 1,
  juz: 1,
  page: 1,
  arabicText: "بِسْمِ",
  transliteration: "Bismi",
  translationBosnian: "U ime",
  tajwidSegments: [{ text: "بِسْمِ", rule: "normal" }],
  audio: { reciterId: "x", url: "/a.mp3", durationMs: 0 },
} as Ayah;

vi.mock("@/store/playerStore", () => ({
  usePlayerStore: vi.fn((sel: (s: unknown) => unknown) =>
    sel({
      currentAyahId: null,
      isPlaying: false,
      setQueue: () => {},
      play: () => {},
      pause: () => {},
    })
  ),
}));

vi.mock("@/store/settingsStore", () => ({
  useSettingsStore: vi.fn((sel: (s: unknown) => unknown) =>
    sel({
      arabicFontSize: 28,
      showTransliteration: true,
      showTranslation: true,
      showTajwidColors: true,
    })
  ),
}));

const mockToggleBookmark = vi.fn();
const mockIsBookmarked = vi.fn();

vi.mock("@/store/bookmarkStore", () => ({
  useBookmarkStore: vi.fn((sel: (s: unknown) => unknown) =>
    sel({
      toggleBookmark: mockToggleBookmark,
      isBookmarked: mockIsBookmarked,
    })
  ),
}));

const mockShowToast = vi.fn();
vi.mock("@/store/toastStore", () => ({
  useToastStore: vi.fn((sel: (s: unknown) => unknown) =>
    sel({
      showToast: mockShowToast,
    })
  ),
}));

vi.mock("@/hooks/useMediaQuery", () => ({
  useIsMobile: vi.fn(() => false),
}));

const defaultProps = {
  ayah: mockAyah,
  surahAyahs: [mockAyah],
  surahNameLatin: "Al-Fatihah",
  arabicFontSize: 28,
  showTransliteration: true,
  showTranslation: true,
  showTajwidColors: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = "";
  mockIsBookmarked.mockReturnValue(false);
});

describe("AyahCard bookmark", () => {
  it("shows bookmark button with aria-label Bookmark", async () => {
    render(<AyahCard {...defaultProps} />);
    const btn = await screen.findByRole("button", { name: /bookmark/i, timeout: 8000 });
    expect(btn).toBeInTheDocument();
  }, 10000);

  it("when authenticated: calls toggleBookmark and showToast when adding bookmark", async () => {
    const user = userEvent.setup();
    mockIsBookmarked.mockReturnValue(false);
    vi.spyOn(authHelpers, "isAuthenticated").mockReturnValue(true);
    render(<AyahCard {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /bookmark/i }));
    expect(mockToggleBookmark).toHaveBeenCalledWith(1, 1, "Al-Fatihah", "بِسْمِ", "U ime");
    expect(mockShowToast).toHaveBeenCalledWith("Ajet dodan u oznacene");
  });

  it("when authenticated: calls toggleBookmark and showToast when removing bookmark", async () => {
    const user = userEvent.setup();
    mockIsBookmarked.mockReturnValue(true);
    vi.spyOn(authHelpers, "isAuthenticated").mockReturnValue(true);
    render(<AyahCard {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /bookmark/i }));
    expect(mockToggleBookmark).toHaveBeenCalledWith(1, 1, "Al-Fatihah", "بِسْمِ", "U ime");
    expect(mockShowToast).toHaveBeenCalledWith("Ajet uklonjen iz oznacenih");
  });

  it("when authenticated: bookmark button has amber accent when bookmarked", () => {
    mockIsBookmarked.mockReturnValue(true);
    vi.spyOn(authHelpers, "isAuthenticated").mockReturnValue(true);
    render(<AyahCard {...defaultProps} />);
    const btn = screen.getByRole("button", { name: /bookmark/i });
    expect(btn.className).toMatch(/amber/);
  });

  it("when authenticated: bookmark button has muted styling when not bookmarked", () => {
    mockIsBookmarked.mockReturnValue(false);
    vi.spyOn(authHelpers, "isAuthenticated").mockReturnValue(true);
    render(<AyahCard {...defaultProps} />);
    const btn = screen.getByRole("button", { name: /bookmark/i });
    expect(btn.className).toMatch(/stone/);
  });

  it("when not authenticated: does not toggle bookmark and shows gentle login prompt", async () => {
    const user = userEvent.setup();
    mockIsBookmarked.mockReturnValue(false);
    vi.spyOn(authHelpers, "isAuthenticated").mockReturnValue(false);
    render(<AyahCard {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /bookmark/i }));
    expect(mockToggleBookmark).not.toHaveBeenCalled();
    expect(mockShowToast).toHaveBeenCalledWith(
      "Za spremanje zabilješki prijavi se ili kreiraj račun."
    );
  });
});
