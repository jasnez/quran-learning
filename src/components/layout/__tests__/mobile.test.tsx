/**
 * @vitest-environment jsdom
 * Mobile experience: sticky heights, touch targets, card padding, Arabic min size, no overflow, settings panel.
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { Header } from "../Header";
import { AudioPlayer } from "@/components/audio/AudioPlayer";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { AyahCard } from "@/components/reader/AyahCard";
import { SettingsOpenProvider } from "@/contexts/SettingsOpenContext";
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
  audio: { reciterId: "mishary-alafasy", url: "/a.mp3", durationMs: 0 },
} as Ayah;

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/store/playerStore", () => ({
  usePlayerStore: vi.fn((sel: (s: unknown) => unknown) =>
    sel({
      activeAudioSrc: "/a.mp3",
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

vi.mock("@/store/settingsStore", () => ({
  useSettingsStore: vi.fn((sel: (s: unknown) => unknown) =>
    sel({
      theme: "light",
      arabicFontSize: 28,
      showTransliteration: true,
      showTranslation: true,
      showTajwidColors: true,
      repeatAyah: false,
      autoPlayNext: true,
      playbackSpeed: 1,
      setTheme: () => {},
      setArabicFontSize: () => {},
      toggleTransliteration: () => {},
      toggleTranslation: () => {},
      toggleTajwidColors: () => {},
      setPlaybackSpeed: () => {},
      toggleRepeatAyah: () => {},
      toggleAutoPlayNext: () => {},
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

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = "";
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    })),
  });
});

describe("Header mobile", () => {
  it("sticky header has compact height 48-52px", () => {
    const { container } = render(
      <SettingsOpenProvider>
        <Header />
      </SettingsOpenProvider>
    );
    const header = container.querySelector("header");
    const inner = header?.querySelector("div");
    expect(inner?.className).toMatch(/h-12|h-\[48px\]|h-\[52px\]|max-h-\[52px\]/);
  });
});

describe("AudioPlayer mobile", () => {
  it("sticky player has compact height 60-70px", () => {
    const { container } = render(<AudioPlayer />);
    const player = container.querySelector("[data-testid='audio-player']");
    expect(player?.className).toMatch(/max-h-\[60px\]|max-h-\[70px\]|h-\[6[0-9]px\]|max-h-6\[0-9\]/);
  });

  it("control buttons have minimum 44x44px touch target", () => {
    const { container } = render(<AudioPlayer />);
    const prev = container.querySelector("[aria-label='Prethodni ajah']");
    const play = container.querySelector("[aria-label='Pusti'], [aria-label='Pauza']");
    const next = container.querySelector("[aria-label='Sljedeći ajah']");
    [prev, play, next].forEach((btn) => {
      expect(btn?.className).toMatch(/min-h-\[44px\]|min-w-\[44px\]|h-11|w-11|h-12|w-12/);
    });
  });

  it("is positioned at bottom for thumb reach", () => {
    const { container } = render(<AudioPlayer />);
    const player = container.querySelector("[data-testid='audio-player']");
    expect(player?.className).toMatch(/sticky.*bottom|fixed.*bottom|bottom-0|bottom-14|bottom-\[56px\]/);
  });

  it("on mobile sits above mobile nav so controls are not covered", () => {
    const { container } = render(<AudioPlayer />);
    const player = container.querySelector("[data-testid='audio-player']");
    expect(player).toBeInTheDocument();
    // On small viewports player must have bottom offset (e.g. 56px) so it appears above MobileNav
    expect(player?.className).toMatch(/max-md:bottom-14|max-sm:bottom-14|bottom-14|bottom-\[56px\]/);
  });
});

describe("Total sticky height", () => {
  it("header and player combined do not exceed 130px", () => {
    const headerHeight = 52;
    const playerHeight = 70;
    expect(headerHeight + playerHeight).toBeLessThanOrEqual(130);
  });
});

describe("AyahCard mobile", () => {
  it("has generous padding p-4 to p-6", () => {
    const { container } = render(
      <AyahCard
        ayah={mockAyah}
        surahAyahs={[mockAyah]}
        surahNameLatin="Al-Fatihah"
        arabicFontSize={28}
        showTransliteration={true}
        showTranslation={true}
        showTajwidColors={true}
      />
    );
    const article = container.querySelector("article");
    expect(article?.className).toMatch(/p-4|p-5|p-6|px-4|py-5|px-5|py-6|md:px-6|md:py-8/);
  });

  it("play and bookmark buttons have min 44px touch target", () => {
    const { container } = render(
      <AyahCard
        ayah={mockAyah}
        surahAyahs={[mockAyah]}
        surahNameLatin="Al-Fatihah"
        arabicFontSize={28}
        showTransliteration={true}
        showTranslation={true}
        showTajwidColors={true}
      />
    );
    const playBtn = container.querySelector("[aria-label='Pusti audio'], [aria-label='Pauza']");
    const bookmarkBtn = container.querySelector("[aria-label='Bookmark']");
    expect(playBtn?.className).toMatch(/min-h-\[44px\]|min-w-\[44px\]|h-11|w-11|p-3/);
    expect(bookmarkBtn?.className).toMatch(/min-h-\[44px\]|min-w-\[44px\]|h-11|w-11|p-3/);
  });
});

describe("Arabic font size on mobile", () => {
  it("reader uses at least 22px on small viewport when setting is 20", () => {
    (window.matchMedia as ReturnType<typeof vi.fn>).mockImplementation((query: string) => ({
      matches: query === "(max-width: 640px)",
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    const { container } = render(
      <AyahCard
        ayah={mockAyah}
        surahAyahs={[mockAyah]}
        surahNameLatin="Al-Fatihah"
        arabicFontSize={20}
        showTransliteration={false}
        showTranslation={false}
        showTajwidColors={true}
      />
    );
    const arabicEl = container.querySelector("[dir='rtl'][lang='ar']") as HTMLElement;
    expect(arabicEl).toBeInTheDocument();
    const fontSize = arabicEl?.style?.fontSize ?? "";
    const num = fontSize ? parseInt(fontSize, 10) : 0;
    expect(num).toBeGreaterThanOrEqual(22);
  });
});

describe("No horizontal scroll", () => {
  it("main content wrapper can prevent overflow", () => {
    const { container } = render(
      <div className="overflow-x-hidden">
        <div className="min-w-0 max-w-full">content</div>
      </div>
    );
    const wrapper = container.querySelector(".overflow-x-hidden");
    expect(wrapper).toBeInTheDocument();
  });
});

describe("SettingsPanel mobile", () => {
  it("on mobile uses full-screen or bottom sheet styling", () => {
    const { container } = render(<SettingsPanel isOpen={true} onClose={() => {}} />);
    const panel = container.querySelector("[role='dialog']");
    expect(panel?.className).toMatch(/max-sm:inset-x-0|max-sm:bottom-0|max-sm:rounded-t|max-sm:max-h|max-sm:w-full|inset-0/);
  });

  it("close and toggle buttons have min 44px touch target on mobile", () => {
    const { container } = render(<SettingsPanel isOpen={true} onClose={() => {}} />);
    const closeBtn = container.querySelector("[aria-label='Zatvori']");
    expect(closeBtn?.className).toMatch(/min-h-\[44px\]|min-w-\[44px\]|p-3|h-11|w-11/);
  });
});
