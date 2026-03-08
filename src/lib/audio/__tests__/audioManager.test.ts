import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

function createMockAudio() {
  const listeners: Record<string, (() => void)[]> = {};
  return {
    src: "",
    currentTime: 0,
    duration: NaN,
    playbackRate: 1,
    play: vi.fn(() => Promise.resolve()),
    pause: vi.fn(),
    load: vi.fn(),
    addEventListener: vi.fn((event: string, cb: () => void) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(cb);
    }),
    removeEventListener: vi.fn((event: string, cb: () => void) => {
      if (listeners[event]) listeners[event] = listeners[event].filter((f) => f !== cb);
    }),
    _listeners: listeners,
    _emit(event: string) {
      listeners[event]?.forEach((cb) => cb());
    },
    _setCurrentTime(v: number) {
      this.currentTime = v;
    },
    _setDuration(v: number) {
      this.duration = v;
    },
  };
}

let mockAudioInstance: ReturnType<typeof createMockAudio>;

beforeEach(() => {
  mockAudioInstance = createMockAudio();
  const AudioConstructor = function (this: unknown) {
    return mockAudioInstance;
  };
  vi.stubGlobal("Audio", AudioConstructor);
  vi.stubGlobal("window", {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("audioManager", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe("loadAudio", () => {
    it("sets audio src and calls load", async () => {
      const { loadAudio } = await import("../audioManager");
      loadAudio("/audio/001001.mp3");
      expect(mockAudioInstance.src).toBe("/audio/001001.mp3");
      expect(mockAudioInstance.load).toHaveBeenCalled();
    });
  });

  describe("play", () => {
    it("calls play on the audio element", async () => {
      const { play } = await import("../audioManager");
      play();
      expect(mockAudioInstance.play).toHaveBeenCalled();
    });
  });

  describe("pause", () => {
    it("calls pause on the audio element", async () => {
      const { pause } = await import("../audioManager");
      pause();
      expect(mockAudioInstance.pause).toHaveBeenCalled();
    });
  });

  describe("seek", () => {
    it("sets currentTime on the audio element", async () => {
      const { seek } = await import("../audioManager");
      seek(42.5);
      expect(mockAudioInstance.currentTime).toBe(42.5);
    });
  });

  describe("setPlaybackRate", () => {
    it("sets playbackRate on the audio element", async () => {
      const { setPlaybackRate } = await import("../audioManager");
      setPlaybackRate(1.5);
      expect(mockAudioInstance.playbackRate).toBe(1.5);
    });
  });

  describe("onTimeUpdate", () => {
    it("registers a timeupdate listener", async () => {
      const { onTimeUpdate } = await import("../audioManager");
      const cb = vi.fn();
      onTimeUpdate(cb);
      expect(mockAudioInstance.addEventListener).toHaveBeenCalledWith("timeupdate", cb);
    });

    it("returns an unsubscribe function that removes the listener", async () => {
      const { onTimeUpdate } = await import("../audioManager");
      const cb = vi.fn();
      const unsubscribe = onTimeUpdate(cb);
      expect(typeof unsubscribe).toBe("function");
      unsubscribe();
      expect(mockAudioInstance.removeEventListener).toHaveBeenCalledWith("timeupdate", cb);
    });

    it("after unsubscribe, callback is not invoked when event fires", async () => {
      const { onTimeUpdate } = await import("../audioManager");
      const cb = vi.fn();
      const unsubscribe = onTimeUpdate(cb);
      unsubscribe();
      mockAudioInstance._emit("timeupdate");
      expect(cb).not.toHaveBeenCalled();
    });
  });

  describe("onEnded", () => {
    it("registers an ended listener", async () => {
      const { onEnded } = await import("../audioManager");
      const cb = vi.fn();
      onEnded(cb);
      expect(mockAudioInstance.addEventListener).toHaveBeenCalledWith("ended", cb);
    });

    it("returns an unsubscribe function that removes the listener", async () => {
      const { onEnded } = await import("../audioManager");
      const cb = vi.fn();
      const unsubscribe = onEnded(cb);
      expect(typeof unsubscribe).toBe("function");
      unsubscribe();
      expect(mockAudioInstance.removeEventListener).toHaveBeenCalledWith("ended", cb);
    });

    it("after unsubscribe, callback is not invoked when ended fires", async () => {
      const { onEnded } = await import("../audioManager");
      const cb = vi.fn();
      const unsubscribe = onEnded(cb);
      unsubscribe();
      mockAudioInstance._emit("ended");
      expect(cb).not.toHaveBeenCalled();
    });

    it("only the still-subscribed callback runs when ended fires after one unsub", async () => {
      const { onEnded } = await import("../audioManager");
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      const unsub1 = onEnded(cb1);
      onEnded(cb2);
      unsub1();
      mockAudioInstance._emit("ended");
      expect(cb1).not.toHaveBeenCalled();
      expect(cb2).toHaveBeenCalledTimes(1);
    });
  });

  describe("getCurrentTime", () => {
    it("returns currentTime of the audio element", async () => {
      const { getCurrentTime, seek } = await import("../audioManager");
      seek(10);
      expect(getCurrentTime()).toBe(10);
    });
  });

  describe("getDuration", () => {
    it("returns duration of the audio element", async () => {
      const mod = await import("../audioManager");
      mockAudioInstance._setDuration(120);
      expect(mod.getDuration()).toBe(120);
    });
  });

  describe("destroy", () => {
    it("cleans up and allows new instance on next use", async () => {
      const mod = await import("../audioManager");
      mod.loadAudio("/a.mp3");
      mod.destroy();
      const mod2 = await import("../audioManager");
      mod2.loadAudio("/b.mp3");
      expect(mockAudioInstance.src).toBe("/b.mp3");
    });
  });
});
