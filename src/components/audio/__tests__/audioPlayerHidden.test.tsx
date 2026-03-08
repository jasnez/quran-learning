/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { AudioPlayer } from "../AudioPlayer";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/store/playerStore", () => ({
  usePlayerStore: vi.fn((sel: (s: unknown) => unknown) =>
    sel({
      activeAudioSrc: null,
      currentSurahId: null,
      currentAyahId: null,
      isPlaying: false,
    })
  ),
}));
vi.mock("@/store/settingsStore", () => ({
  useSettingsStore: vi.fn((sel: (s: unknown) => unknown) =>
    sel({ repeatAyah: false, autoPlayNext: true, playbackSpeed: 1 })
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = "";
});

describe("AudioPlayer hidden state", () => {
  it("renders nothing when no active audio (user has not played anything)", () => {
    const { container } = render(<AudioPlayer />);
    expect(container.querySelector("[data-testid='audio-player']")).toBeNull();
  });
});
