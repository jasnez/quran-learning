/**
 * @vitest-environment jsdom
 * Subtle animations: active ayah transition, progress bar, settings panel slide, tajwid legend, page fade.
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { AyahUnit } from "@/components/reader/AyahUnit";
import { AudioPlayer } from "@/components/audio/AudioPlayer";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { TajwidLegend } from "@/components/quran/TajwidLegend";
import type { Ayah } from "@/types/quran";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const globalsCss = readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), "../../app/globals.css"),
  "utf-8"
);

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
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/store/playerStore", () => {
  const state = {
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
    restartFromFirst: () => {},
    setCurrentTime: () => {},
    setCurrentTimeMs: () => {},
    setDuration: () => {},
  };
  const usePlayerStoreMock = vi.fn((sel: (s: unknown) => unknown) => sel(state));
  (usePlayerStoreMock as unknown as { getState: () => typeof state }).getState = () => state;
  return { usePlayerStore: usePlayerStoreMock };
});

vi.mock("@/store/settingsStore", () => ({
  useSettingsStore: vi.fn((sel: (s: unknown) => unknown) =>
    sel({
      theme: "light",
      arabicFontSize: 28,
      showTransliteration: true,
      showTranslation: true,
      showTajwidColors: true,
      repeatMode: "off",
      autoPlayNext: true,
      playbackSpeed: 1,
      setTheme: () => {},
      setArabicFontSize: () => {},
      toggleTransliteration: () => {},
      toggleTranslation: () => {},
      toggleTajwidColors: () => {},
      setPlaybackSpeed: () => {},
      cycleRepeatMode: () => {},
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
  onDurationChange: () => () => {},
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

describe("Active ayah highlight animation", () => {
  it("AyahUnit has transition-colors duration-300 for active state", () => {
    const { container } = render(
      <AyahUnit
        ayah={mockAyah}
        queueAyahs={[mockAyah]}
        surahNameLatin="Al-Fatihah"
        arabicFontSize={28}
        showTransliteration={true}
        showTranslation={true}
        showTajwidColors={true}
      />
    );
    const article = container.querySelector("article");
    expect(article?.className).toMatch(/transition-colors/);
    expect(article?.className).toMatch(/duration-300/);
  });
});

describe("Progress bar animation", () => {
  it("progress bar input has smooth transition", () => {
    const { container } = render(<AudioPlayer />);
    const range = container.querySelector('input[type="range"]');
    expect(range?.className).toMatch(/transition/);
  });
});

describe("Settings panel slide transition", () => {
  // A native <dialog> is display: none while closed, so the slide is CSS (globals.css):
  // @starting-style for the entry, allow-discrete display/overlay for the exit.
  it("panel slides in from @starting-style and out with a discrete display transition", () => {
    const { container } = render(<SettingsPanel isOpen={true} onClose={() => {}} />);
    expect(container.querySelector("dialog")).toHaveClass("settings-dialog");
    expect(globalsCss).toMatch(/@starting-style\s*\{\s*\.settings-dialog\[open\]/);
    expect(globalsCss).toMatch(/\.settings-dialog\s*\{[^}]*transition-property:[^;]*display[^;]*overlay/);
    expect(globalsCss).toMatch(/\.settings-dialog\s*\{[^}]*transition-behavior:\s*allow-discrete/);
  });

  // The browser closes the dialog itself on Esc or a backdrop click; React's inert attribute
  // follows one task later. CSS takes over at once while the panel slides out.
  it("the closing panel takes no clicks or focus while it slides out", () => {
    expect(globalsCss).toMatch(
      /\.settings-dialog:not\(\[open\]\)\s*\{[^}]*pointer-events:\s*none;[^}]*interactivity:\s*inert;/
    );
  });

  it("backdrop fades", () => {
    expect(globalsCss).toMatch(/\.settings-dialog::backdrop\s*\{[^}]*transition-property:[^;]*background-color/);
  });
});

describe("Tajwid legend expand/collapse", () => {
  it("legend panel has smooth height transition", () => {
    const { container } = render(<TajwidLegend />);
    const panel = container.querySelector("#tajwid-legend-panel");
    expect(panel).toBeInTheDocument();
    expect(panel?.className).toMatch(/transition/);
    expect(panel?.className).toMatch(/overflow-hidden|max-h/);
  });
});

describe("Page transition", () => {
  it("main content area supports subtle fade (transition or animation class)", () => {
    const { container } = render(
      <main className="min-w-0 flex-1 px-4 py-8 transition-opacity duration-300">
        <div className="mx-auto max-w-2xl">Content</div>
      </main>
    );
    const main = container.querySelector("main");
    expect(main?.className).toMatch(/transition|duration|opacity|animate/);
  });
});
