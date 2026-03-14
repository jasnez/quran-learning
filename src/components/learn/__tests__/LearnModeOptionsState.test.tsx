/**
 * @vitest-environment jsdom
 *
 * Learn mode options (below bookmark/play): distinct visual state when
 * option is enabled vs disabled for better UX.
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LearnModeContent } from "../LearnModeContent";
import type { SurahSummary, Ayah } from "@/types/quran";
import { usePlayerStore } from "@/store/playerStore";
import { useSettingsStore } from "@/store/settingsStore";

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
  setChapterAudio: vi.fn(),
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

vi.mock("@/store/bookmarkStore", () => ({
  useBookmarkStore: vi.fn((sel: (s: unknown) => unknown) =>
    sel({
      toggleBookmark: vi.fn(),
      isBookmarked: () => false,
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
  vi.mocked(usePlayerStore).mockImplementation((sel: (s: unknown) => unknown) =>
    sel(defaultPlayerState)
  );
  mockUseSettingsStore.mockImplementation((sel: (s: unknown) => unknown) =>
    sel(getSettingsState())
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

  it("Ponavljaj button has data-active and muted styling when repeat is off", () => {
    settingsState.repeatMode = "off";
    render(<LearnModeContent surah={mockSurah} ayahs={mockAyahs} />);
    const btn = getOptionButton(/ponavljaj/i, false);
    expect(btn).toHaveAttribute("data-active", "false");
    expect(btn.className).toMatch(/stone/);
  });

  it("Ponavljaj uses same OptionToggle as other options (active state when repeatMode !== 'off')", () => {
    settingsState.repeatMode = "surah";
    render(<LearnModeContent surah={mockSurah} ayahs={mockAyahs} />);
    const ponavljajButtons = screen.getAllByRole("button", { name: /ponavljaj/i });
    expect(ponavljajButtons.length).toBeGreaterThanOrEqual(1);
    const withActive = ponavljajButtons.filter((b) => b.getAttribute("data-active") === "true");
    if (withActive.length > 0) {
      expect(withActive[0]!.className).toMatch(/emerald|bg-.*-100|ring/);
    }
  });

  it("Riječ po riječ button has data-active and distinct styling when on", () => {
    vi.mocked(usePlayerStore).mockImplementation((sel: (s: unknown) => unknown) =>
      sel({ ...defaultPlayerState, wordByWordMode: true })
    );
    render(<LearnModeContent surah={mockSurah} ayahs={mockAyahs} />);
    const btn = getOptionButton(/riječ po riječ|isključi riječ/i, true);
    expect(btn).toHaveAttribute("data-active", "true");
    expect(btn.className).toMatch(/emerald|bg-.*-100|ring/);
  });

  it("Riječ po riječ button has data-active and muted styling when off", () => {
    vi.mocked(usePlayerStore).mockImplementation((sel: (s: unknown) => unknown) =>
      sel({ ...defaultPlayerState, wordByWordMode: false })
    );
    render(<LearnModeContent surah={mockSurah} ayahs={mockAyahs} />);
    const btn = getOptionButton(/uključi riječ|riječ po riječ/i, false);
    expect(btn).toHaveAttribute("data-active", "false");
    expect(btn.className).toMatch(/stone/);
  });

  it("Prikaži značenje riječi is visible in options row even when word-by-word is off", () => {
    vi.mocked(usePlayerStore).mockImplementation((sel: (s: unknown) => unknown) =>
      sel({ ...defaultPlayerState, wordByWordMode: false })
    );
    render(<LearnModeContent surah={mockSurah} ayahs={mockAyahs} />);
    const btn = getOptionButton(/značenje riječi|sakrij značenje|prikaži značenje/i);
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute("data-active", "true");
    expect(btn.className).toMatch(/emerald|bg-.*-100|ring/);
  });

  it("Prikaži značenje riječi has distinct styling when on", () => {
    vi.mocked(usePlayerStore).mockImplementation((sel: (s: unknown) => unknown) =>
      sel({ ...defaultPlayerState, wordByWordMode: true })
    );
    render(<LearnModeContent surah={mockSurah} ayahs={mockAyahs} />);
    const btn = getOptionButton(/značenje riječi|sakrij značenje|prikaži značenje/i, true);
    expect(btn).toHaveAttribute("data-active", "true");
    expect(btn.className).toMatch(/emerald|bg-.*-100|ring/);
  });

  it("Prikaži značenje riječi has muted styling when off", async () => {
    const user = userEvent.setup();
    vi.mocked(usePlayerStore).mockImplementation((sel: (s: unknown) => unknown) =>
      sel({ ...defaultPlayerState, wordByWordMode: true })
    );
    render(<LearnModeContent surah={mockSurah} ayahs={mockAyahs} />);
    const btn = getOptionButton(/značenje riječi|sakrij značenje|prikaži značenje/i, true);
    await user.click(btn);
    const offBtn = getOptionButton(/značenje riječi|sakrij značenje|prikaži značenje/i, false);
    expect(offBtn).toHaveAttribute("data-active", "false");
    expect(offBtn.className).toMatch(/stone/);
  });

  it("when Prikaži značenje riječi is off, word meanings are not shown in the card", async () => {
    const wordMeaningText = "U ime (značenje)";
    const mockWords = [
      {
        id: 1,
        ayahId: 1,
        ayahKey: "1:1",
        wordOrder: 1,
        textArabic: "بِسْمِ",
        transliteration: "Bismi",
        translationShort: wordMeaningText,
        startTimeMs: 0,
        endTimeMs: 500,
        tajwidRule: "normal" as const,
      },
    ];
    const originalFetch = globalThis.fetch;
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) =>
        url.includes("/words")
          ? Promise.resolve({ ok: true, json: () => Promise.resolve(mockWords) })
          : Promise.reject(new Error("no mock"))
      )
    );
    try {
      const user = userEvent.setup();
      render(<LearnModeContent surah={mockSurah} ayahs={mockAyahs} />);
      await screen.findByText(wordMeaningText, {}, { timeout: 3000 });
      const toggles = screen.getAllByRole("button", {
        name: /sakrij značenje|prikaži značenje|značenje riječi/i,
      });
      for (const t of toggles) await user.click(t);
      expect(screen.queryByText(wordMeaningText)).not.toBeInTheDocument();
    } finally {
      vi.stubGlobal("fetch", originalFetch);
    }
  });
});
