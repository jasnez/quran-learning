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
const mockRestartFromFirst = vi.fn();
const mockStop = vi.fn();

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
  restartFromFirst: mockRestartFromFirst,
  stop: mockStop,
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
  useSettingsStore: vi.fn((selector: (s: { repeatMode: string; autoPlayNext: boolean; playbackSpeed: number; cycleRepeatMode: () => void; toggleAutoPlayNext: () => void }) => unknown) =>
    selector(settingsState)
  ),
}));

let settingsState: {
  repeatMode: "off" | "surah" | "ayah";
  autoPlayNext: boolean;
  playbackSpeed: number;
  cycleRepeatMode: () => void;
  toggleAutoPlayNext: () => void;
};

const mockCycleRepeatMode = vi.fn();
const mockToggleAutoPlayNext = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  cleanup();
  document.body.innerHTML = "";
  settingsState = { repeatMode: "off", autoPlayNext: true, playbackSpeed: 1, cycleRepeatMode: mockCycleRepeatMode, toggleAutoPlayNext: mockToggleAutoPlayNext };
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

  it("shows stop button with accessible label", () => {
    render(<AudioPlayer />);
    const stopBtn = screen.getByRole("button", { name: /stop|zaustavi/i });
    expect(stopBtn).toBeInTheDocument();
  });

  it("clicking stop button calls store stop and hides player when activeAudioSrc is cleared", () => {
    render(<AudioPlayer />);
    const stopBtn = screen.getByRole("button", { name: /stop|zaustavi/i });
    fireEvent.click(stopBtn);
    expect(mockStop).toHaveBeenCalledTimes(1);
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

  it("when audio ends and not at last ayah, advances to next ayah and does not pause (autoplay is surah-level)", () => {
    playerState.currentSurahId = "1";
    playerState.currentAyahId = "1:3";
    settingsState.autoPlayNext = false;
    mockNext.mockReturnValue(true);
    render(<AudioPlayer />);
    const endedHandler = mockOnEnded.mock.calls[0]?.[0];
    endedHandler();
    expect(mockNext).toHaveBeenCalled();
    expect(mockPauseStore).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("when audio ends at last ayah and autoPlayNext is false, pauses and does not navigate", () => {
    playerState.currentSurahId = "1";
    playerState.currentAyahId = "1:7";
    settingsState.autoPlayNext = false;
    settingsState.repeatMode = "off";
    mockNext.mockReturnValue(false);
    render(<AudioPlayer />);
    const endedHandler = mockOnEnded.mock.calls[0]?.[0];
    endedHandler();
    expect(mockNext).toHaveBeenCalled();
    expect(mockPauseStore).toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("when audio ends at last ayah and repeatMode is surah, calls restartFromFirst", () => {
    playerState.currentSurahId = "1";
    playerState.currentAyahId = "1:7";
    settingsState.repeatMode = "surah";
    settingsState.autoPlayNext = false;
    mockNext.mockReturnValue(false);
    render(<AudioPlayer />);
    const endedHandler = mockOnEnded.mock.calls[0]?.[0];
    endedHandler();
    expect(mockNext).toHaveBeenCalled();
    expect(mockRestartFromFirst).toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("when audio ends and repeatMode is ayah, seeks to 0 and plays (repeat ayah)", () => {
    settingsState.repeatMode = "ayah";
    render(<AudioPlayer />);
    const endedHandler = mockOnEnded.mock.calls[0]?.[0];
    endedHandler();
    expect(mockSeek).toHaveBeenCalledWith(0);
    expect(mockPlay).toHaveBeenCalled();
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("autoplay control is a toggle switch with thumb containing play icon", () => {
    render(<AudioPlayer />);
    const autoplayBtn = screen.getByRole("button", { name: /sljedeća sura|autoplay|automatski/i });
    const thumb = autoplayBtn.querySelector("[data-autoplay-thumb]");
    expect(thumb).toBeInTheDocument();
    expect(autoplayBtn.querySelector("[data-autoplay-thumb] svg")).toBeInTheDocument();
  });

  it("autoplay switch thumb is on right when on", () => {
    settingsState.autoPlayNext = true;
    render(<AudioPlayer />);
    const autoplayBtn = screen.getByRole("button", { name: /sljedeća sura|autoplay|automatski/i });
    expect(autoplayBtn).toHaveAttribute("aria-pressed", "true");
    const thumb = autoplayBtn.querySelector("[data-autoplay-thumb]");
    expect(thumb?.parentElement).toHaveClass("justify-end");
  });

  it("autoplay switch thumb is on left when off", () => {
    settingsState.autoPlayNext = false;
    render(<AudioPlayer />);
    const autoplayBtn = screen.getByRole("button", { name: /sljedeća sura|autoplay|automatski/i });
    expect(autoplayBtn).toHaveAttribute("aria-pressed", "false");
    const thumb = autoplayBtn.querySelector("[data-autoplay-thumb]");
    expect(thumb?.parentElement).toHaveClass("justify-start");
  });

  it("shows repeat control with accessible label (surah or ayah)", () => {
    render(<AudioPlayer />);
    const repeatBtn = screen.getByRole("button", { name: /ponavljaj|ponavljanje|repeat/i });
    expect(repeatBtn).toBeInTheDocument();
  });

  it("clicking repeat control calls cycleRepeatMode", () => {
    render(<AudioPlayer />);
    const repeatBtn = screen.getByRole("button", { name: /ponavljaj|ponavljanje|repeat/i });
    fireEvent.click(repeatBtn);
    expect(mockCycleRepeatMode).toHaveBeenCalledTimes(1);
  });

  it("repeat button has pressed state when repeatMode is surah or ayah", () => {
    settingsState.repeatMode = "surah";
    render(<AudioPlayer />);
    const repeatBtn = screen.getByRole("button", { name: /ponavljaj|ponavljanje|repeat/i });
    expect(repeatBtn).toHaveAttribute("aria-pressed", "true");
  });

  it("when repeatMode is ayah, repeat button shows Repeat One icon (with 1)", () => {
    settingsState.repeatMode = "ayah";
    render(<AudioPlayer />);
    const repeatBtn = screen.getByRole("button", { name: /ponavljaj|ponavljanje|repeat/i });
    const svg = repeatBtn.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(repeatBtn.textContent).toContain("1");
  });

  it("when repeatMode is off, repeat button shows loop icon without 1", () => {
    settingsState.repeatMode = "off";
    render(<AudioPlayer />);
    const repeatBtn = screen.getByRole("button", { name: /ponavljaj|ponavljanje|repeat/i });
    expect(repeatBtn.textContent).not.toContain("1");
  });

  it("shows autoplay next surah toggle with accessible label", () => {
    render(<AudioPlayer />);
    const autoplayBtn = screen.getByRole("button", { name: /sljedeća sura|autoplay|automatski/i });
    expect(autoplayBtn).toBeInTheDocument();
  });

  it("clicking autoplay toggle calls toggleAutoPlayNext", () => {
    render(<AudioPlayer />);
    const autoplayBtn = screen.getByRole("button", { name: /sljedeća sura|autoplay|automatski/i });
    fireEvent.click(autoplayBtn);
    expect(mockToggleAutoPlayNext).toHaveBeenCalledTimes(1);
  });

  it("autoplay button has pressed state when autoPlayNext is true", () => {
    settingsState.autoPlayNext = true;
    render(<AudioPlayer />);
    const autoplayBtn = screen.getByRole("button", { name: /sljedeća sura|autoplay|automatski/i });
    expect(autoplayBtn).toHaveAttribute("aria-pressed", "true");
  });
});
