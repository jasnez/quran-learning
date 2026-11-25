/**
 * @vitest-environment jsdom
 *
 * Names that say which ayah (WCAG 1.3.1, 4.1.2) and match the visible text (2.5.3) in the reader.
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Ayah } from "@/types/quran";
import surahs from "@/data/surahs.json";
import { AyahUnit } from "../AyahUnit";
import { ReaderToolbar } from "../ReaderToolbar";
import { SurahAyahNav } from "../SurahAyahNav";
import { SurahReaderContent } from "../SurahReaderContent";

const bookmarkState = vi.hoisted(() => ({
  bookmarks: [] as { id: string; surahNumber: number; ayahNumber: number }[],
  toggleBookmark: vi.fn(),
}));
const showToast = vi.hoisted(() => vi.fn());

vi.mock("@/store/playerStore", () => {
  const state = {
    currentAyahId: null,
    isPlaying: false,
    wordByWordMode: false,
    setWordByWordMode: vi.fn(),
    setQueue: vi.fn(),
    play: vi.fn(),
    pause: vi.fn(),
  };
  const m = vi.fn((sel: (s: unknown) => unknown) => sel(state));
  (m as { getState?: () => typeof state }).getState = () => state;
  return { usePlayerStore: m };
});

vi.mock("@/store/settingsStore", () => ({
  useSettingsStore: vi.fn((sel: (s: unknown) => unknown) =>
    sel({
      arabicFontSize: 28,
      arabicFontStyle: "naskh",
      showTransliteration: false,
      showTranslation: true,
      showTajwidColors: false,
      setArabicFontSize: vi.fn(),
      setArabicFontStyle: vi.fn(),
      toggleTransliteration: vi.fn(),
      toggleTranslation: vi.fn(),
      toggleTajwidColors: vi.fn(),
    }),
  ),
}));

vi.mock("@/store/bookmarkStore", async (importOriginal) => ({
  hasBookmark: (await importOriginal<typeof import("@/store/bookmarkStore")>()).hasBookmark,
  useBookmarkStore: vi.fn((sel: (s: unknown) => unknown) => sel(bookmarkState)),
}));

vi.mock("@/store/toastStore", () => ({
  useToastStore: vi.fn((sel: (s: unknown) => unknown) => sel({ showToast })),
}));

vi.mock("@/store/progressStore", () => {
  const state = { markAyahRead: vi.fn(), updateLastPosition: vi.fn(), addSurahVisited: vi.fn() };
  const m = vi.fn((sel: (s: unknown) => unknown) => sel(state));
  (m as { getState?: () => typeof state }).getState = () => state;
  return { useProgressStore: m };
});

vi.mock("@/hooks/useMediaQuery", () => ({ useIsMobile: vi.fn(() => false) }));
vi.mock("@/lib/audio/audioManager", () => ({ play: () => Promise.resolve(), pause: () => {}, seek: () => {} }));

const ayah = (id: string): Ayah =>
  ({
    id,
    ayahNumber: Number(id.split(":")[1]),
    ayahNumberGlobal: 0,
    juz: 1,
    page: 1,
    arabicText: "بِسْمِ",
    transliteration: "",
    translationBosnian: "",
    tajwidSegments: [{ text: "بِسْمِ", rule: "normal" }],
    audio: { reciterId: "mishary-alafasy", url: "", durationMs: 0 },
  }) as Ayah;

const props = (a: Ayah, extra: Record<string, unknown> = {}) => ({
  ayah: a,
  queueAyahs: [a],
  surahNameLatin: "Al-Fatihah",
  arabicFontSize: 28,
  showTransliteration: false,
  showTranslation: false,
  showTajwidColors: false,
  ...extra,
});

beforeEach(() => {
  vi.clearAllMocks();
  bookmarkState.bookmarks = [];
});
afterEach(cleanup);

describe("AyahUnit names", () => {
  it("the article is named by its number badge, and the play button says which ayah", () => {
    render(<AyahUnit {...props(ayah("1:12"))} />);
    const article = screen.getByRole("article", { name: "12. ajet" });
    expect(within(article).getByRole("button", { name: "Pusti 12. ajet" })).toHaveAttribute("title", "Pusti 12. ajet");
    // The badge still shows only the number; the rest is for screen readers.
    expect(article.querySelector("[id^='ayah-number-']")?.firstChild?.textContent).toBe("12");
  });

  it("in the juz reader the names add the surah, verbatim from the data", () => {
    const naba = surahs.find((s) => s.surahNumber === 78)!.nameLatin;
    render(<AyahUnit {...props(ayah("78:1"), { queueSource: "juz", surahNameLatin: naba })} />);
    expect(screen.getByRole("article", { name: `1. ajet sure ${naba}` })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: `Pusti 1. ajet sure ${naba}` })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: `Sačuvaj 1. ajet sure ${naba}` })).toBeInTheDocument();
  });

  it("the bookmark button is named by its state, without aria-pressed, and the toast uses the number", async () => {
    render(<AyahUnit {...props(ayah("1:3"))} />);
    const save = screen.getByRole("button", { name: "Sačuvaj 3. ajet" });
    expect(save).not.toHaveAttribute("aria-pressed");
    expect(save).toHaveAttribute("title", "Sačuvaj 3. ajet");
    await userEvent.click(save);
    expect(showToast).toHaveBeenCalledWith("3. ajet je sačuvan.");

    cleanup();
    bookmarkState.bookmarks = [{ id: "1-3", surahNumber: 1, ayahNumber: 3 }];
    render(<AyahUnit {...props(ayah("1:3"))} />);
    const remove = screen.getByRole("button", { name: "Ukloni 3. ajet iz sačuvanih" });
    expect(remove).not.toHaveAttribute("aria-pressed");
    await userEvent.click(remove);
    expect(showToast).toHaveBeenLastCalledWith("3. ajet je uklonjen iz sačuvanih.");
  });
});

describe("AyahUnit page badge", () => {
  it("shows Str. N visibly and says Stranica N to screen readers, without aria-label", () => {
    const a = { ...ayah("1:5"), page: 3 };
    const { container } = render(<AyahUnit {...props(a, { showPageBadge: true })} />);
    const visible = screen.getByText("Str. 3");
    expect(visible).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("Stranica 3")).toHaveClass("sr-only");
    expect(container.querySelector("[aria-label^='Stranica']")).toBeNull();
  });
});

describe("ReaderToolbar names", () => {
  it("the display chips are a group named Prikaz", () => {
    render(<ReaderToolbar />);
    const group = screen.getByRole("group", { name: "Prikaz" });
    expect(within(group).getByRole("button", { name: "Prijevod" })).toBeInTheDocument();
  });

  it("visible text is the name; toggles have aria-pressed and no aria-label", () => {
    render(<ReaderToolbar />);
    expect(screen.getByRole("button", { name: "Manja slova" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Veća slova" })).toBeInTheDocument();
    expect(screen.getByText("Veličina slova:")).toHaveClass("sr-only");
    expect(screen.getByRole("group", { name: "Arapsko pismo" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Moderno" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Klasično" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Praćenje uz zvuk" })).toBeInTheDocument();
    const translation = screen.getByRole("button", { name: "Prijevod", pressed: true });
    expect(translation).not.toHaveAttribute("aria-label");
    expect(screen.getByRole("button", { name: "Transkripcija", pressed: false })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tedžvid boje", pressed: false })).toBeInTheDocument();
    expect(screen.queryByLabelText("Sve postavke")).toBeNull();
  });

  it("settings is a link named by its visible text when no panel is provided", () => {
    render(<ReaderToolbar />);
    const link = screen.getByRole("link", { name: "Postavke" });
    expect(link).not.toHaveAttribute("aria-label");
  });
});

describe("SurahAyahNav", () => {
  it("a saved ayah says so inside the link, not with aria-label on a span", () => {
    bookmarkState.bookmarks = [{ id: "1-2", surahNumber: 1, ayahNumber: 2 }];
    render(<SurahAyahNav ayahs={[ayah("1:1"), ayah("1:2")]} surahNumber={1} />);
    expect(screen.getByRole("link", { name: "2, sačuvan" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "1" })).toBeInTheDocument();
  });
});

describe("SurahReaderContent juz divider", () => {
  it("is not a separator and holds no link inside one", () => {
    // 2:141 is the last ayah of juz 1, 2:142 the first of juz 2.
    const { container } = render(
      <SurahReaderContent ayahs={[ayah("2:141"), ayah("2:142")]} surahNameLatin="El-Bekare" />,
    );
    expect(screen.getByRole("link", { name: "Džuz 2" })).toBeInTheDocument();
    expect(container.querySelector("[role='separator']")).toBeNull();
  });
});
