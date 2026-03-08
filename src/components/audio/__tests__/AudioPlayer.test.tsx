/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { AudioPlayer } from "../AudioPlayer";

const mockLoadAudio = vi.fn();
const mockPlay = vi.fn();
const mockPause = vi.fn();
const mockSeek = vi.fn();
const mockSetPlaybackRate = vi.fn();
const mockOnTimeUpdate = vi.fn();
const mockOnEnded = vi.fn();
const mockGetCurrentTime = vi.fn(() => 0);
const mockGetDuration = vi.fn(() => 0);

const timeUpdateCleanup = vi.fn();
const endedCleanup = vi.fn();

vi.mock("@/lib/audio/audioManager", () => ({
  loadAudio: (url: string) => mockLoadAudio(url),
  play: () => Promise.resolve(mockPlay()),
  pause: () => mockPause(),
  seek: (t: number) => mockSeek(t),
  setPlaybackRate: (s: number) => mockSetPlaybackRate(s),
  onTimeUpdate: (cb: () => void) => {
    mockOnTimeUpdate(cb);
    return timeUpdateCleanup;
  },
  onEnded: (cb: () => void) => {
    mockOnEnded(cb);
    return endedCleanup;
  },
  getCurrentTime: () => mockGetCurrentTime(),
  getDuration: () => mockGetDuration(),
}));

const mockResume = vi.fn();
const mockPauseStore = vi.fn();
const mockNext = vi.fn();
const mockPrevious = vi.fn();
const mockSetCurrentTime = vi.fn();
const mockSetDuration = vi.fn();
const mockPush = vi.fn();

const playerState = {
  currentSurahId: "1",
  currentAyahId: "1:3",
  isPlaying: false,
  queue: [] as unknown[],
  activeAudioSrc: "/audio/001003.mp3",
  currentTime: 10,
  duration: 45,
  resume: mockResume,
  pause: mockPauseStore,
  next: mockNext,
  previous: mockPrevious,
  setCurrentTime: mockSetCurrentTime,
  setDuration: mockSetDuration,
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/store/playerStore", () => {
  const storeFn = vi.fn((selector: (s: typeof playerState) => unknown) =>
    selector(playerState)
  );
  (storeFn as { getState: () => typeof playerState }).getState = () => ({ ...playerState });
  return { usePlayerStore: storeFn };
});

vi.mock("@/store/settingsStore", () => ({
  useSettingsStore: vi.fn((selector: (s: { repeatAyah: boolean; autoPlayNext: boolean; playbackSpeed: number; toggleRepeatAyah: () => void; toggleAutoPlayNext: () => void }) => unknown) =>
    selector(settingsState)
  ),
}));

let settingsState: {
  repeatAyah: boolean;
  autoPlayNext: boolean;
  playbackSpeed: number;
  toggleRepeatAyah: () => void;
  toggleAutoPlayNext: () => void;
};

const mockToggleRepeatAyah = vi.fn();
const mockToggleAutoPlayNext = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  cleanup();
  document.body.innerHTML = "";
  settingsState = { repeatAyah: false, autoPlayNext: true, playbackSpeed: 1, toggleRepeatAyah: mockToggleRepeatAyah, toggleAutoPlayNext: mockToggleAutoPlayNext };
  playerState.currentSurahId = "1";
  playerState.currentAyahId = "1:3";
  playerState.isPlaying = false;
  playerState.activeAudioSrc = "/audio/001003.mp3";
  playerState.currentTime = 10;
  playerState.duration = 45;
  mockGetCurrentTime.mockReturnValue(0);
  mockGetDuration.mockReturnValue(0);
});

describe("AudioPlayer listener cleanup", () => {
  it("returns cleanup from onTimeUpdate and calls it on unmount", () => {
    const { unmount } = render(<AudioPlayer />);
    expect(mockOnTimeUpdate).toHaveBeenCalled();
    unmount();
    expect(timeUpdateCleanup).toHaveBeenCalledTimes(1);
  });

  it("returns cleanup from onEnded and calls it on unmount", () => {
    const { unmount } = render(<AudioPlayer />);
    expect(mockOnEnded).toHaveBeenCalled();
    unmount();
    expect(endedCleanup).toHaveBeenCalledTimes(1);
  });
});

describe("AudioPlayer", () => {
  it("renders nothing when activeAudioSrc is null", () => {
    playerState.activeAudioSrc = null;
    const { container } = render(<AudioPlayer />);
    expect(container.firstChild).toBeNull();
  });

  it("renders sticky bar when activeAudioSrc is set", () => {
    render(<AudioPlayer />);
    expect(screen.getByRole("region", { name: /audio player/i })).toBeInTheDocument();
  });

  it("shows surah and ayah label", () => {
    render(<AudioPlayer />);
    const labels = screen.getAllByText(/Surah\s+1/);
    expect(labels.length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Ajah\s+3/).length).toBeGreaterThanOrEqual(1);
  });

  it("shows play button when paused", () => {
    render(<AudioPlayer />);
    const playBtn = screen.getByRole("button", { name: /pusti/i });
    expect(playBtn).toBeInTheDocument();
  });

  it("shows pause button when playing", () => {
    playerState.isPlaying = true;
    render(<AudioPlayer />);
    expect(screen.getByRole("button", { name: /pause|pauza/i })).toBeInTheDocument();
  });

  it("Previous button calls store previous", () => {
    render(<AudioPlayer />);
    const prev = screen.getByRole("button", { name: /prethodn/i });
    fireEvent.click(prev);
    expect(mockPrevious).toHaveBeenCalled();
  });

  it("Next button calls store next", () => {
    render(<AudioPlayer />);
    const nextBtn = screen.getByRole("button", { name: /sljedeći ajah/i });
    fireEvent.click(nextBtn);
    expect(mockNext).toHaveBeenCalled();
  });

  it("Play button calls resume", () => {
    render(<AudioPlayer />);
    const playBtn = screen.getByRole("button", { name: /pusti/i });
    fireEvent.click(playBtn);
    expect(mockResume).toHaveBeenCalled();
  });

  it("Pause button calls store pause", () => {
    playerState.isPlaying = true;
    render(<AudioPlayer />);
    const pauseBtn = screen.getByRole("button", { name: /pauza/i });
    fireEvent.click(pauseBtn);
    expect(mockPauseStore).toHaveBeenCalled();
  });

  it("progress bar is present", () => {
    render(<AudioPlayer />);
    const slider = screen.getByRole("slider", { name: /trajanje/i });
    expect(slider).toBeInTheDocument();
  });

  it("when new source loads with isPlaying true, then user pauses, audioManager.pause() is called", () => {
    playerState.activeAudioSrc = "/audio/001004.mp3";
    playerState.isPlaying = true;
    const { rerender } = render(<AudioPlayer />);
    expect(mockPlay).toHaveBeenCalled();
    mockPause.mockClear();
    playerState.isPlaying = false;
    rerender(<AudioPlayer />);
    expect(mockPause).toHaveBeenCalled();
  });

  it("when activeAudioSrc transitions from URL to null, audioManager.pause() is called so audio stops", () => {
    playerState.activeAudioSrc = "/audio/001001.mp3";
    playerState.isPlaying = true;
    const { rerender } = render(<AudioPlayer />);
    expect(mockLoadAudio).toHaveBeenCalledWith("/audio/001001.mp3");
    mockPause.mockClear();
    playerState.activeAudioSrc = null;
    playerState.isPlaying = false;
    rerender(<AudioPlayer />);
    expect(mockPause).toHaveBeenCalled();
  });

  it("when playback speed changes while audio is playing, audio does not stop (sync effect cleanup does not run)", () => {
    playerState.activeAudioSrc = "/audio/001001.mp3";
    playerState.isPlaying = true;
    const { rerender } = render(<AudioPlayer />);
    expect(mockPlay).toHaveBeenCalled();
    mockPause.mockClear();
    settingsState.playbackSpeed = 1.5;
    rerender(<AudioPlayer />);
    expect(mockPause).not.toHaveBeenCalled();
  });

  it("when audio ends at last ayah and autoPlayNext is true, navigates to next surah with autoplay", () => {
    playerState.currentSurahId = "1";
    playerState.currentAyahId = "1:7";
    mockNext.mockReturnValue(false);
    render(<AudioPlayer />);
    const endedHandler = mockOnEnded.mock.calls[0]?.[0];
    expect(typeof endedHandler).toBe("function");
    endedHandler();
    expect(mockNext).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/surah/2?autoplay=1");
  });

  it("when audio ends at last ayah and surah is 114, does not navigate", () => {
    playerState.currentSurahId = "114";
    playerState.currentAyahId = "114:6";
    mockNext.mockReturnValue(false);
    render(<AudioPlayer />);
    const endedHandler = mockOnEnded.mock.calls[0]?.[0];
    endedHandler();
    expect(mockNext).toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("shows repeat ayah toggle with accessible label", () => {
    render(<AudioPlayer />);
    const repeatBtn = screen.getByRole("button", { name: /ponavljaj ajet|isključi ponavljanje|repeat/i });
    expect(repeatBtn).toBeInTheDocument();
  });

  it("shows autoplay next surah toggle with accessible label", () => {
    render(<AudioPlayer />);
    const autoplayBtn = screen.getByRole("button", { name: /sljedeća sura|autoplay|automatski/i });
    expect(autoplayBtn).toBeInTheDocument();
  });

  it("clicking repeat toggle calls toggleRepeatAyah", () => {
    render(<AudioPlayer />);
    const repeatBtn = screen.getByRole("button", { name: /ponavljaj ajet|isključi ponavljanje|repeat/i });
    fireEvent.click(repeatBtn);
    expect(mockToggleRepeatAyah).toHaveBeenCalledTimes(1);
  });

  it("clicking autoplay toggle calls toggleAutoPlayNext", () => {
    render(<AudioPlayer />);
    const autoplayBtn = screen.getByRole("button", { name: /sljedeća sura|autoplay|automatski/i });
    fireEvent.click(autoplayBtn);
    expect(mockToggleAutoPlayNext).toHaveBeenCalledTimes(1);
  });

  it("repeat button has pressed state when repeatAyah is true", () => {
    settingsState.repeatAyah = true;
    render(<AudioPlayer />);
    const repeatBtn = screen.getByRole("button", { name: /ponavljaj|ponavljanje|repeat/i });
    expect(repeatBtn).toHaveAttribute("aria-pressed", "true");
  });

  it("autoplay button has pressed state when autoPlayNext is true", () => {
    settingsState.autoPlayNext = true;
    render(<AudioPlayer />);
    const autoplayBtn = screen.getByRole("button", { name: /sljedeća sura|autoplay|automatski/i });
    expect(autoplayBtn).toHaveAttribute("aria-pressed", "true");
  });
});
