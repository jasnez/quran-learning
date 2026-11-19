/**
 * @vitest-environment jsdom
 *
 * Learn mode options (below bookmark/play): distinct visual state when
 * option is enabled vs disabled for better UX.
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { LearnModeContent } from "../LearnModeContent";
import type { SurahSummary, Ayah } from "@/types/quran";
import { usePlayerStore } from "@/store/playerStore";
import { useSettingsStore } from "@/store/settingsStore";

type PlayerState = ReturnType<typeof usePlayerStore.getState>;
type SettingsState = ReturnType<typeof useSettingsStore.getState>;

const mockSurah: SurahSummary = {
  id: "1",
  surahNumber: 1,
  slug: "al-fatiha",
  nameArabic: "الفاتحة",
  nameLatin: "Al-Fatihah",
  nameBosnian: "Al-Fatihah",
  revelationType: "meccan",
  ayahCount: 2,
};

const mockAyahs: Ayah[] = [
  {
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
  } as Ayah,
  {
    id: "1:2",
    ayahNumber: 2,
    ayahNumberGlobal: 2,
    juz: 1,
    page: 1,
    arabicText: "ٱلْحَمْدُ",
    transliteration: "Alhamdu",
    translationBosnian: "Hvala",
    tajwidSegments: [{ text: "ٱلْحَمْدُ", rule: "normal" }],
    audio: { reciterId: "x", url: "/b.mp3", durationMs: 0 },
  } as Ayah,
];

const defaultPlayerState = {
  currentAyahId: "1:1" as string | null,
  isPlaying: false,
  setQueue: vi.fn(),
  setCurrentAyah: vi.fn(),
  play: vi.fn(),
  pause: vi.fn(),
  next: vi.fn(),
  previous: vi.fn(),
  setCurrentTime: vi.fn(),
  setPendingSeek: vi.fn(),
  wordByWordMode: false,
  setWordByWordMode: vi.fn(),
  currentTimeMsStore: 0,
};

vi.mock("@/store/playerStore", () => ({
  usePlayerStore: vi.fn(),
}));

const createSettings = (overrides: {
  showTransliteration?: boolean;
  showTranslation?: boolean;
  repeatMode?: "off" | "surah" | "ayah";
}) => ({
  arabicFontSize: 28,
  showTransliteration: true,
  showTranslation: true,
  showTajwidColors: true,
  repeatMode: "off" as const,
  toggleTransliteration: vi.fn(),
  toggleTranslation: vi.fn(),
  cycleRepeatMode: vi.fn(),
  ...overrides,
});

/** Mutable state so the mock always sees latest values (like SettingsPanel tests). */
let settingsState: ReturnType<typeof createSettings>;
/** Getter so mock can read current state at call time. */
let getSettingsState: () => ReturnType<typeof createSettings>;

vi.mock("@/store/settingsStore", () => ({
  useSettingsStore: vi.fn(),
}));

const mockUseSettingsStore = vi.mocked(useSettingsStore);

vi.mock("@/store/bookmarkStore", async (importOriginal) => ({
  hasBookmark: (await importOriginal<typeof import("@/store/bookmarkStore")>()).hasBookmark,
  useBookmarkStore: vi.fn((sel: (s: unknown) => unknown) =>
    sel({
      toggleBookmark: vi.fn(),
      bookmarks: [],
    })
  ),
}));

vi.mock("@/store/toastStore", () => ({
  useToastStore: vi.fn((sel: (s: unknown) => unknown) =>
    sel({ showToast: vi.fn() })
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  settingsState = createSettings({});
  getSettingsState = () => settingsState;
  vi.mocked(usePlayerStore).mockImplementation((sel) =>
    sel(defaultPlayerState as unknown as PlayerState)
  );
  mockUseSettingsStore.mockImplementation((sel) =>
    sel(getSettingsState() as unknown as SettingsState)
  );
});

/** Option buttons live in the learn footer. When multiple trees (StrictMode), pick the button with the expected state so tests are stable. */
function getOptionButton(
  name: string | RegExp,
  expectedActive?: boolean
): HTMLElement {
  const regions = screen.getAllByTestId("learn-options");
  for (const r of regions) {
    const buttons = within(r).queryAllByRole("button", { name });
    for (const b of buttons) {
      if (
        expectedActive === undefined ||
        b.getAttribute("data-active") === String(expectedActive)
      )
        return b;
    }
  }
  throw new Error(
    `No option button matching ${String(name)} with data-active=${expectedActive ?? "any"}`
  );
}

describe("Learn mode options visual state (enabled vs disabled)", () => {
  it("Transliteracija button has data-active and distinct styling when on", () => {
    settingsState.showTransliteration = true;
    render(<LearnModeContent surah={mockSurah} ayahs={mockAyahs} />);
    const btn = getOptionButton(/transliteracij/i, true);
    expect(btn).toHaveAttribute("data-active", "true");
    expect(btn.className).toMatch(/emerald|bg-.*-100|ring/);
  });

  it("Transliteracija button has data-active and muted styling when off", () => {
    settingsState.showTransliteration = false;
    render(<LearnModeContent surah={mockSurah} ayahs={mockAyahs} />);
    const btn = getOptionButton(/transliteracij/i, false);
    expect(btn).toHaveAttribute("data-active", "false");
    expect(btn.className).toMatch(/stone/);
  });

  it("Prijevod button has data-active and distinct styling when on", () => {
    settingsState.showTranslation = true;
    render(<LearnModeContent surah={mockSurah} ayahs={mockAyahs} />);
    const btn = getOptionButton(/prijevod/i, true);
    expect(btn).toHaveAttribute("data-active", "true");
    expect(btn.className).toMatch(/emerald|bg-.*-100|ring/);
  });

  it("Prijevod button has data-active and muted styling when off", () => {
    settingsState.showTranslation = false;
    render(<LearnModeContent surah={mockSurah} ayahs={mockAyahs} />);
    const btn = getOptionButton(/prijevod/i, false);
    expect(btn).toHaveAttribute("data-active", "false");
    expect(btn.className).toMatch(/stone/);
  });

  it("Ponavljanje button has data-active and muted styling when repeat is off", () => {
    settingsState.repeatMode = "off";
    render(<LearnModeContent surah={mockSurah} ayahs={mockAyahs} />);
    const btn = getOptionButton("Ponavljanje: isključeno", false);
    expect(btn).not.toHaveAttribute("aria-pressed");
    expect(btn).toHaveAttribute("data-active", "false");
    expect(btn.className).toMatch(/stone/);
  });

  it("Ponavljanje uses same OptionToggle as other options (active state when repeatMode !== 'off')", () => {
    settingsState.repeatMode = "surah";
    render(<LearnModeContent surah={mockSurah} ayahs={mockAyahs} />);
    const btn = getOptionButton("Ponavljanje: sura", true);
    expect(btn).not.toHaveAttribute("aria-pressed");
    expect(btn.className).toMatch(/emerald|bg-.*-100|ring/);
  });

  // A toggle has a fixed name plus aria-pressed, or a name that carries its state: never both.
  it("fixed-name toggles use aria-pressed and no aria-label; repeat has neither", () => {
    settingsState.showTranslation = true;
    render(<LearnModeContent surah={mockSurah} ayahs={mockAyahs} />);
    const prijevod = getOptionButton("Prijevod");
    expect(prijevod).toHaveAttribute("aria-pressed", "true");
    expect(prijevod).not.toHaveAttribute("aria-label");
    expect(getOptionButton("Transliteracija")).toHaveAttribute("aria-pressed");
    expect(getOptionButton("Riječ po riječ")).toHaveAttribute("aria-pressed");
    expect(getOptionButton("Ponavljanje: isključeno")).not.toHaveAttribute("aria-label");
  });

  it("Riječ po riječ button has data-active and distinct styling when on", () => {
    vi.mocked(usePlayerStore).mockImplementation((sel) =>
      sel({ ...defaultPlayerState, wordByWordMode: true } as unknown as PlayerState)
    );
    render(<LearnModeContent surah={mockSurah} ayahs={mockAyahs} />);
    const btn = getOptionButton(/riječ po riječ|isključi riječ/i, true);
    expect(btn).toHaveAttribute("data-active", "true");
    expect(btn.className).toMatch(/emerald|bg-.*-100|ring/);
  });

  it("Riječ po riječ button has data-active and muted styling when off", () => {
    vi.mocked(usePlayerStore).mockImplementation((sel) =>
      sel({ ...defaultPlayerState, wordByWordMode: false } as unknown as PlayerState)
    );
    render(<LearnModeContent surah={mockSurah} ayahs={mockAyahs} />);
    const btn = getOptionButton(/uključi riječ|riječ po riječ/i, false);
    expect(btn).toHaveAttribute("data-active", "false");
    expect(btn.className).toMatch(/stone/);
  });

  // The word-meaning toggle was removed (QA P1-2): there is no Bosnian word-gloss source.
  it("has no word-meaning toggle", () => {
    render(<LearnModeContent surah={mockSurah} ayahs={mockAyahs} />);
    expect(screen.queryByRole("button", { name: /značenje riječi/i })).toBeNull();
  });

  it("when Riječ po riječ is off, the ayah is plain tajwid text with no word highlight", () => {
    vi.mocked(usePlayerStore).mockImplementation(((sel: (s: unknown) => unknown) =>
      sel({ ...defaultPlayerState, wordByWordMode: false, currentTimeMs: 100 })) as never);
    render(<LearnModeContent surah={mockSurah} ayahs={mockAyahs} />);
    expect(document.querySelector("[data-word-by-word]")).toBeNull();
    expect(document.querySelectorAll("[data-word-index][data-active=\"true\"]")).toHaveLength(0);
  });
});
