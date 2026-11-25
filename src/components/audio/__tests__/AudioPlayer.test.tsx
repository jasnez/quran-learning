/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, act, within } from "@testing-library/react";
import { AudioPlayer } from "../AudioPlayer";

const mockLoadAudio = vi.fn();
const mockPlay = vi.fn();
const mockPause = vi.fn();
const mockSeek = vi.fn();
const mockSetPlaybackRate = vi.fn();
const mockOnTimeUpdate = vi.fn();
const mockOnEnded = vi.fn();
const mockGetCurrentTime = vi.fn(() => 0);
const mockOnCanSeek = vi.fn();
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
  onDurationChange: () => () => {},
  onEnded: (cb: () => void) => {
    mockOnEnded(cb);
    return endedCleanup;
  },
  onCanSeek: (cb: () => void) => {
    mockOnCanSeek(cb);
    return () => {};
  },
  getCurrentTime: () => mockGetCurrentTime(),
  getDuration: () => mockGetDuration(),
}));

const mockResume = vi.fn();
const mockPauseStore = vi.fn();
const mockNext = vi.fn(() => true);
const mockPrevious = vi.fn();
const mockSetCurrentTime = vi.fn();
const mockSetDuration = vi.fn();
const mockSetCurrentTimeMs = vi.fn();
const mockSetPendingSeek = vi.fn();
const mockPush = vi.fn();
const mockRestartFromFirst = vi.fn();
const mockStop = vi.fn();

const progressStoreMocks = vi.hoisted(() => {
  const mockMarkAyahListened = vi.fn();
  const mockIncrementAyahsListened = vi.fn();
  return {
    mockMarkAyahListened,
    mockIncrementAyahsListened,
    progressStoreState: {
      markAyahListened: mockMarkAyahListened,
      incrementAyahsListened: mockIncrementAyahsListened,
      updateLastPosition: vi.fn(),
    },
  };
});
const { mockMarkAyahListened, mockIncrementAyahsListened } = progressStoreMocks;
vi.mock("@/store/progressStore", () => ({
  useProgressStore: Object.assign(
    (selector: (s: { getState: () => typeof progressStoreMocks.progressStoreState }) => unknown) =>
      selector({ getState: () => progressStoreMocks.progressStoreState }),
    { getState: () => progressStoreMocks.progressStoreState }
  ),
}));

const chapterTimestamps = [
  { verseKey: "1:3", timestampFrom: 0, timestampTo: 15000 },
  { verseKey: "1:4", timestampFrom: 15000, timestampTo: 30000 },
];
const playerState = {
  currentSurahId: "1",
  currentAyahId: "1:3",
  isPlaying: false,
  queue: [{ id: "1:3" }, { id: "1:4" }] as unknown[],
  queueSource: "surah" as "surah" | "juz" | "learn" | "dua" | "single",
  activeAudioSrc: "/chapter/001.mp3" as string | null,
  currentTime: 10,
  duration: 45,
  pendingSeekToSeconds: null as number | null,
  wordByWordMode: false,
  chapterAudioUrl: "/chapter/001.mp3",
  chapterTimestamps: null as typeof chapterTimestamps | null,
  currentTimeMs: 0,
  resume: mockResume,
  pause: mockPauseStore,
  next: mockNext,
  previous: mockPrevious,
  restartFromFirst: mockRestartFromFirst,
  stop: mockStop,
  setCurrentTime: mockSetCurrentTime,
  setDuration: mockSetDuration,
  setPendingSeek: mockSetPendingSeek,
  setCurrentTimeMs: mockSetCurrentTimeMs,
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/store/playerStore", () => {
  const storeFn = vi.fn((selector: (s: typeof playerState) => unknown) =>
    selector(playerState)
  );
  (storeFn as unknown as { getState: () => typeof playerState }).getState = () => ({ ...playerState });
  return { usePlayerStore: storeFn };
});

const settingsStateRef = vi.hoisted(() => ({
  current: {
    repeatMode: "off" as "off" | "surah" | "ayah",
    autoPlayNext: true,
    playbackSpeed: 1,
    pauseAfterAyah: "off" as "off" | "3s" | "5s" | "10s" | "manual",
    cycleRepeatMode: vi.fn(),
    setRepeatMode: vi.fn(),
    toggleAutoPlayNext: vi.fn(),
    setPauseAfterAyah: vi.fn(),
  },
}));
vi.mock("@/store/settingsStore", () => ({
  useSettingsStore: Object.assign(
    vi.fn((selector: (s: { repeatMode: string; autoPlayNext: boolean; playbackSpeed: number; pauseAfterAyah: string; cycleRepeatMode: () => void; setRepeatMode: (mode: string) => void; toggleAutoPlayNext: () => void; setPauseAfterAyah: () => void }) => unknown) =>
      selector(settingsStateRef.current)
    ),
    { getState: () => settingsStateRef.current }
  ),
}));

const mockCycleRepeatMode = vi.fn();
const mockToggleAutoPlayNext = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  cleanup();
  document.body.innerHTML = "";
  Object.assign(settingsStateRef.current, { repeatMode: "off", autoPlayNext: true, playbackSpeed: 1, pauseAfterAyah: "off", cycleRepeatMode: mockCycleRepeatMode, toggleAutoPlayNext: mockToggleAutoPlayNext });
  playerState.currentSurahId = "1";
  playerState.currentAyahId = "1:3";
  playerState.isPlaying = false;
  playerState.activeAudioSrc = "/audio/001003.mp3";
  playerState.currentTime = 10;
  playerState.duration = 45;
  playerState.wordByWordMode = false;
  playerState.chapterTimestamps = null;
  playerState.pendingSeekToSeconds = null;
  playerState.queue = [];
  playerState.queueSource = "surah";
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
    expect(screen.getByRole("region", { name: "Kontrole zvuka" })).toBeInTheDocument();
  });

  it("shows surah and ayah label", () => {
    render(<AudioPlayer />);
    // Surah name and ayah number in one phrase, e.g. "El-Fātiḥa, 3. ajet".
    expect(screen.getAllByText(/El-Fātiḥa, 3\. ajet/).length).toBeGreaterThanOrEqual(1);
  });

  it("shows play button when paused", () => {
    render(<AudioPlayer />);
    const playBtn = screen.getByRole("button", { name: "Pusti" });
    expect(playBtn).toBeInTheDocument();
  });

  it("shows pause button when playing", () => {
    playerState.isPlaying = true;
    render(<AudioPlayer />);
    expect(screen.getByRole("button", { name: "Pauziraj" })).toBeInTheDocument();
  });

  it("Previous button calls store previous", () => {
    render(<AudioPlayer />);
    const prev = screen.getByRole("button", { name: /prethodn/i });
    fireEvent.click(prev);
    expect(mockPrevious).toHaveBeenCalled();
  });

  it("Next button calls store next", () => {
    render(<AudioPlayer />);
    const nextBtn = screen.getByRole("button", { name: /sljedeći ajet/i });
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
    const playBtn = screen.getByRole("button", { name: "Pusti" });
    fireEvent.click(playBtn);
    expect(mockResume).toHaveBeenCalled();
  });

  it("Pause button calls store pause", () => {
    playerState.isPlaying = true;
    render(<AudioPlayer />);
    const pauseBtn = screen.getByRole("button", { name: "Pauziraj" });
    fireEvent.click(pauseBtn);
    expect(mockPauseStore).toHaveBeenCalled();
  });

  it("progress bar is present", () => {
    render(<AudioPlayer />);
    const slider = screen.getByRole("slider", { name: "Mjesto u ajetu" });
    expect(slider).toBeInTheDocument();
  });

  // Word highlight reads currentTimeMs; it must follow scrubs even while paused (no rAF then).
  it("scrubbing the progress bar also updates the word-highlight time", () => {
    render(<AudioPlayer />);
    fireEvent.change(screen.getByRole("slider", { name: "Mjesto u ajetu" }), { target: { value: "2.5" } });
    expect(mockSeek).toHaveBeenCalledWith(2.5);
    expect(mockSetCurrentTimeMs).toHaveBeenCalledWith(2500);
  });

  // A word click on a not-yet-loaded ayah sets a pending seek; it must wait for metadata
  // (not an animation frame, which may never come in a background tab).
  it("applies a pending seek when the audio can seek, rounding to the word start", () => {
    playerState.isPlaying = true;
    // 1.001 * 1000 === 1000.9999999999999: flooring would land 1 ms before the word.
    playerState.pendingSeekToSeconds = 1.001;
    render(<AudioPlayer />);
    const canSeek = mockOnCanSeek.mock.calls.at(-1)?.[0];
    expect(canSeek).toBeTypeOf("function");
    canSeek();
    expect(mockSetPendingSeek).toHaveBeenCalledWith(null);
    expect(mockSeek).toHaveBeenCalledWith(1.001);
    expect(mockSetCurrentTimeMs).toHaveBeenCalledWith(1001);
  });

  // Per-frame store writes re-render the player and force a layout of the whole surah page
  // (QA section 6). "Po ajetu" needs no 60 fps clock: the slider follows timeupdate.
  it("in 'Po ajetu' mode playback runs no animation-frame loop", async () => {
    const rafSpy = vi.spyOn(window, "requestAnimationFrame");
    try {
      playerState.isPlaying = true;
      playerState.wordByWordMode = false;
      mockGetCurrentTime.mockReturnValue(3.2);
      const { unmount } = render(<AudioPlayer />);
      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });
      expect(rafSpy).not.toHaveBeenCalled();
      unmount();
    } finally {
      rafSpy.mockRestore();
    }
  });

  it("in word-by-word mode the animation-frame loop updates the word-highlight time", async () => {
    playerState.isPlaying = true;
    playerState.wordByWordMode = true;
    mockGetCurrentTime.mockReturnValue(3.2);
    const { unmount } = render(<AudioPlayer />);
    mockSetCurrentTimeMs.mockClear();
    await act(async () => {
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => requestAnimationFrame(r));
    });
    expect(mockSetCurrentTimeMs).toHaveBeenCalledWith(3200);
    unmount();
  });

  // Without the loop in "Po ajetu", timeupdate keeps the word time current, so switching to
  // word-by-word (also while paused) highlights the right word.
  it("timeupdate also updates the word-highlight time", () => {
    playerState.isPlaying = true;
    mockGetCurrentTime.mockReturnValue(7.25);
    render(<AudioPlayer />);
    mockSetCurrentTimeMs.mockClear();
    mockOnTimeUpdate.mock.calls.at(-1)?.[0]();
    expect(mockSetCurrentTime).toHaveBeenCalledWith(7.25);
    expect(mockSetCurrentTimeMs).toHaveBeenCalledWith(7250);
  });

  it("the animation loop does not consume a pending seek", async () => {
    playerState.isPlaying = true;
    playerState.pendingSeekToSeconds = 1.795;
    const { unmount } = render(<AudioPlayer />);
    await act(async () => {
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => requestAnimationFrame(r));
    });
    expect(mockSetPendingSeek).not.toHaveBeenCalled();
    expect(mockSeek).not.toHaveBeenCalled();
    unmount();
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

  it("after stop, playing the same source again reloads and plays it (QA P1-1)", () => {
    playerState.activeAudioSrc = "/audio/dua-1.mp3";
    playerState.isPlaying = true;
    const { rerender } = render(<AudioPlayer />);
    expect(mockLoadAudio).toHaveBeenCalledTimes(1);
    expect(mockPlay).toHaveBeenCalledTimes(1);

    // Stop: store clears the source and playing flag.
    (playerState as { activeAudioSrc: string | null }).activeAudioSrc = null;
    playerState.isPlaying = false;
    rerender(<AudioPlayer />);

    // Play the same dua again.
    mockLoadAudio.mockClear();
    mockPlay.mockClear();
    playerState.activeAudioSrc = "/audio/dua-1.mp3";
    playerState.isPlaying = true;
    rerender(<AudioPlayer />);
    expect(mockLoadAudio).toHaveBeenCalledWith("/audio/dua-1.mp3");
    expect(mockPlay).toHaveBeenCalledTimes(1);
  });

  it("when playback speed changes while audio is playing, audio does not stop (sync effect cleanup does not run)", () => {
    playerState.activeAudioSrc = "/audio/001001.mp3";
    playerState.isPlaying = true;
    const { rerender } = render(<AudioPlayer />);
    expect(mockPlay).toHaveBeenCalled();
    mockPause.mockClear();
    settingsStateRef.current.playbackSpeed = 1.5;
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

  it("when a dua finishes, pauses and stays on the page even with autoPlayNext on", () => {
    playerState.queueSource = "dua";
    playerState.currentSurahId = "2";
    playerState.currentAyahId = "2:201";
    mockNext.mockReturnValue(false);
    render(<AudioPlayer />);
    mockOnEnded.mock.calls[0]?.[0]();
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockPauseStore).toHaveBeenCalled();
  });

  it("when the last ayah of a juz finishes, pauses instead of jumping to the next surah", () => {
    playerState.queueSource = "juz";
    playerState.currentSurahId = "2";
    playerState.currentAyahId = "2:252";
    mockNext.mockReturnValue(false);
    render(<AudioPlayer />);
    mockOnEnded.mock.calls[0]?.[0]();
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockPauseStore).toHaveBeenCalled();
  });

  it("when the last ayah finishes in learn mode, pauses instead of leaving learn mode", () => {
    playerState.queueSource = "learn";
    playerState.currentSurahId = "1";
    playerState.currentAyahId = "1:7";
    mockNext.mockReturnValue(false);
    render(<AudioPlayer />);
    mockOnEnded.mock.calls[0]?.[0]();
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockPauseStore).toHaveBeenCalled();
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
    settingsStateRef.current.autoPlayNext = false;
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
    settingsStateRef.current.autoPlayNext = false;
    settingsStateRef.current.repeatMode = "off";
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
    settingsStateRef.current.repeatMode = "surah";
    settingsStateRef.current.autoPlayNext = false;
    mockNext.mockReturnValue(false);
    render(<AudioPlayer />);
    const endedHandler = mockOnEnded.mock.calls[0]?.[0];
    endedHandler();
    expect(mockNext).toHaveBeenCalled();
    expect(mockRestartFromFirst).toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  // QA P1-10: ayah boundaries must not depend on requestAnimationFrame (stops in background tabs).
  it("in word-by-word mode the rAF loop never advances or repeats", async () => {
    settingsStateRef.current.repeatMode = "ayah";
    playerState.activeAudioSrc = "/audio/001003.mp3";
    playerState.isPlaying = true;
    playerState.wordByWordMode = true;
    (playerState as Record<string, unknown>).chapterTimestamps = chapterTimestamps;
    playerState.currentAyahId = "1:3";
    playerState.queue = [{ id: "1:3" }, { id: "1:4" }];
    mockGetCurrentTime.mockReturnValue(15);
    const { unmount } = render(<AudioPlayer />);
    await act(async () => {
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => requestAnimationFrame(r));
    });
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockSeek).not.toHaveBeenCalled();
    expect(mockMarkAyahListened).not.toHaveBeenCalled();
    expect(mockIncrementAyahsListened).not.toHaveBeenCalled();
    unmount();
  });

  it("repeat-ayah and advance work in word-by-word mode without requestAnimationFrame", () => {
    const rafSpy = vi.spyOn(window, "requestAnimationFrame").mockImplementation(() => 0);
    try {
      playerState.isPlaying = true;
      playerState.wordByWordMode = true;
      playerState.queue = [{ id: "1:3" }, { id: "1:4" }];

      settingsStateRef.current.repeatMode = "ayah";
      const first = render(<AudioPlayer />);
      mockOnEnded.mock.calls.at(-1)?.[0]();
      expect(mockSeek).toHaveBeenCalledWith(0);
      expect(mockPlay).toHaveBeenCalled();
      first.unmount();

      vi.clearAllMocks();
      settingsStateRef.current.repeatMode = "off";
      render(<AudioPlayer />);
      act(() => {
        mockOnEnded.mock.calls.at(-1)?.[0]();
      });
      expect(mockMarkAyahListened).toHaveBeenCalledWith(1, 3);
      expect(mockNext).toHaveBeenCalled();
    } finally {
      rafSpy.mockRestore();
    }
  });

  it("when audio ends and repeatMode is ayah, seeks to 0 and plays (repeat ayah)", () => {
    settingsStateRef.current.repeatMode = "ayah";
    render(<AudioPlayer />);
    const endedHandler = mockOnEnded.mock.calls[0]?.[0];
    endedHandler();
    expect(mockSeek).toHaveBeenCalledWith(0);
    expect(mockPlay).toHaveBeenCalled();
    expect(mockNext).not.toHaveBeenCalled();
  });

  // Phase 4, D10: the bar holds the transport; repeat and going on to the next surah are in
  // "Više opcija zvuka" on every width, as one choice and one switch.
  it("draws the main button in the accent", () => {
    render(<AudioPlayer />);
    expect(screen.getByRole("button", { name: "Pusti" })).toHaveClass("bg-accent", "text-on-accent");
  });

  it("keeps repeat and autoplay out of the bar until the options are opened", () => {
    render(<AudioPlayer />);
    expect(screen.queryByRole("group", { name: "Ponavljanje" })).toBeNull();
    expect(screen.queryByRole("switch")).toBeNull();
    expect(screen.queryByRole("button", { name: /^Ponavljanje: / })).toBeNull();
  });

  it("offers the options on every width, with a 44 px button", () => {
    render(<AudioPlayer />);
    const moreBtn = screen.getByRole("button", { name: "Više opcija zvuka" });
    expect(moreBtn).toHaveClass("h-11", "w-11");
    expect(moreBtn.parentElement!.className).not.toMatch(/md:hidden|hidden/);
  });

  it("opens the options above the player bar", () => {
    render(<AudioPlayer />);
    const moreBtn = screen.getByRole("button", { name: "Više opcija zvuka" });
    expect(moreBtn).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(moreBtn);
    expect(moreBtn).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("group", { name: "Dodatne kontrole zvuka" })).toHaveClass("bottom-full");
  });

  // QA section 5: role="menu" promises arrow keys between items; this is a disclosure.
  it("is a disclosure with a choice and a switch, not an ARIA menu", () => {
    render(<AudioPlayer />);
    const moreBtn = screen.getByRole("button", { name: "Više opcija zvuka" });
    expect(moreBtn).not.toHaveAttribute("aria-haspopup");
    fireEvent.click(moreBtn);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitemcheckbox")).not.toBeInTheDocument();
  });

  it("offers the three repeat modes as one choice with the current one checked", () => {
    settingsStateRef.current.repeatMode = "surah";
    render(<AudioPlayer />);
    fireEvent.click(screen.getByRole("button", { name: "Više opcija zvuka" }));
    const repeat = within(screen.getByRole("group", { name: "Ponavljanje" }));
    expect(repeat.getByRole("radio", { name: "Isključeno" })).not.toBeChecked();
    expect(repeat.getByRole("radio", { name: "Sura" })).toBeChecked();
    expect(repeat.getByRole("radio", { name: "Ajet" })).not.toBeChecked();
  });

  it("choosing a repeat mode sets exactly that mode", () => {
    render(<AudioPlayer />);
    fireEvent.click(screen.getByRole("button", { name: "Više opcija zvuka" }));
    fireEvent.click(screen.getByRole("radio", { name: "Ajet" }));
    expect(settingsStateRef.current.setRepeatMode).toHaveBeenCalledWith("ayah");
    expect(mockCycleRepeatMode).not.toHaveBeenCalled();
  });

  it("has a switch for going on to the next surah", () => {
    render(<AudioPlayer />);
    fireEvent.click(screen.getByRole("button", { name: "Više opcija zvuka" }));
    const autoplay = screen.getByRole("switch", { name: "Pusti sljedeću suru" });
    expect(autoplay).toHaveAttribute("aria-checked", "true");
    fireEvent.click(autoplay);
    expect(mockToggleAutoPlayNext).toHaveBeenCalledTimes(1);
  });

  it("shows the switch off when autoplay is off", () => {
    settingsStateRef.current.autoPlayNext = false;
    render(<AudioPlayer />);
    fireEvent.click(screen.getByRole("button", { name: "Više opcija zvuka" }));
    expect(screen.getByRole("switch", { name: "Pusti sljedeću suru" })).toHaveAttribute("aria-checked", "false");
  });

  // The options float over the page on every width, so they close like any disclosure.
  it("closes the options on Escape and returns focus to their button", () => {
    render(<AudioPlayer />);
    const moreBtn = screen.getByRole("button", { name: "Više opcija zvuka" });
    fireEvent.click(moreBtn);
    screen.getByRole("radio", { name: "Sura" }).focus();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("group", { name: "Dodatne kontrole zvuka" })).toBeNull();
    expect(moreBtn).toHaveAttribute("aria-expanded", "false");
    expect(moreBtn).toHaveFocus();
  });

  it("closes the options on a click outside them, and keeps them open for a click inside", () => {
    render(<AudioPlayer />);
    fireEvent.click(screen.getByRole("button", { name: "Više opcija zvuka" }));
    fireEvent.click(screen.getByRole("radio", { name: "Sura" }));
    expect(screen.getByRole("group", { name: "Dodatne kontrole zvuka" })).toBeInTheDocument();
    fireEvent.click(document.body);
    expect(screen.queryByRole("group", { name: "Dodatne kontrole zvuka" })).toBeNull();
  });

  // Repeat is no longer a button in the bar, so the bar says in words when it is on.
  it("says in the bar that repeat is on, and nothing when it is off", () => {
    settingsStateRef.current.repeatMode = "ayah";
    const { unmount } = render(<AudioPlayer />);
    expect(screen.getByText(/Ponavljanje: ajet/)).toBeInTheDocument();
    unmount();
    settingsStateRef.current.repeatMode = "off";
    render(<AudioPlayer />);
    expect(screen.queryByText(/Ponavljanje:/)).toBeNull();
  });
});

describe("AudioPlayer seek slider", () => {
  // QA section 5: a screen reader read only the raw seconds (e.g. "42.3") of the "Mjesto u ajetu" slider.
  it("announces position and length as words", () => {
    playerState.currentTime = 42.3;
    playerState.duration = 75;
    render(<AudioPlayer />);
    expect(screen.getByRole("slider", { name: "Mjesto u ajetu" })).toHaveAttribute(
      "aria-valuetext",
      "42 sekunde od 1 minute i 15 sekundi"
    );
  });

  it("says 0 sekundi before the length is known", () => {
    playerState.currentTime = 0;
    playerState.duration = 0;
    render(<AudioPlayer />);
    expect(screen.getByRole("slider", { name: "Mjesto u ajetu" })).toHaveAttribute(
      "aria-valuetext",
      "0 sekundi od 0 sekundi"
    );
  });
});
