import { describe, it, expect, beforeEach } from "vitest";
import { usePlayerStore } from "../playerStore";
import type { Ayah } from "@/types/quran";

const mockAyah = (id: string, url: string): Ayah =>
  ({
    id,
    ayahNumber: 1,
    ayahNumberGlobal: 1,
    juz: 1,
    page: 1,
    arabicText: "",
    transliteration: "",
    translationBosnian: "",
    tajwidSegments: [],
    audio: { reciterId: "mishary-alafasy", url, durationMs: 0 },
  }) as Ayah;

describe("playerStore", () => {
  beforeEach(() => {
    usePlayerStore.setState({
      currentSurahId: null,
      currentAyahId: null,
      isPlaying: false,
      queue: [],
      currentTime: 0,
      duration: 0,
      activeAudioSrc: null,
    });
  });

  describe("initial state", () => {
    it("has correct default state", () => {
      const state = usePlayerStore.getState();
      expect(state.currentSurahId).toBeNull();
      expect(state.currentAyahId).toBeNull();
      expect(state.isPlaying).toBe(false);
      expect(state.queue).toEqual([]);
      expect(state.currentTime).toBe(0);
      expect(state.duration).toBe(0);
      expect(state.activeAudioSrc).toBeNull();
    });
  });

  describe("play", () => {
    it("sets current ayah, audio src and isPlaying", () => {
      const ayah = mockAyah("1:1", "/audio/001001.mp3");
      usePlayerStore.getState().play(ayah);
      const state = usePlayerStore.getState();
      expect(state.currentSurahId).toBe("1");
      expect(state.currentAyahId).toBe("1:1");
      expect(state.activeAudioSrc).toBe("/audio/001001.mp3");
      expect(state.isPlaying).toBe(true);
    });

    it("sets queue to single ayah when playing", () => {
      const ayah = mockAyah("2:1", "/audio/002001.mp3");
      usePlayerStore.getState().play(ayah);
      expect(usePlayerStore.getState().queue).toHaveLength(1);
      expect(usePlayerStore.getState().queue[0].id).toBe("2:1");
    });
  });

  describe("pause", () => {
    it("sets isPlaying to false", () => {
      usePlayerStore.getState().play(mockAyah("1:1", "/a.mp3"));
      expect(usePlayerStore.getState().isPlaying).toBe(true);
      usePlayerStore.getState().pause();
      expect(usePlayerStore.getState().isPlaying).toBe(false);
    });
  });

  describe("resume", () => {
    it("sets isPlaying to true", () => {
      usePlayerStore.getState().play(mockAyah("1:1", "/a.mp3"));
      usePlayerStore.getState().pause();
      usePlayerStore.getState().resume();
      expect(usePlayerStore.getState().isPlaying).toBe(true);
    });
  });

  describe("stop", () => {
    it("sets isPlaying to false and activeAudioSrc to null", () => {
      usePlayerStore.getState().play(mockAyah("1:1", "/a.mp3"));
      usePlayerStore.getState().stop();
      const state = usePlayerStore.getState();
      expect(state.isPlaying).toBe(false);
      expect(state.activeAudioSrc).toBeNull();
    });
  });

  describe("next", () => {
    it("moves to next ayah in queue and plays", () => {
      const a1 = mockAyah("1:1", "/a1.mp3");
      const a2 = mockAyah("1:2", "/a2.mp3");
      usePlayerStore.getState().setQueue([a1, a2]);
      usePlayerStore.getState().play(a1);
      usePlayerStore.getState().next();
      const state = usePlayerStore.getState();
      expect(state.currentAyahId).toBe("1:2");
      expect(state.activeAudioSrc).toBe("/a2.mp3");
      expect(state.isPlaying).toBe(true);
    });

    it("does nothing when currentAyahId is null (no current position)", () => {
      const a1 = mockAyah("1:1", "/a1.mp3");
      const a2 = mockAyah("1:2", "/a2.mp3");
      usePlayerStore.getState().setQueue([a1, a2]);
      usePlayerStore.getState().next();
      const state = usePlayerStore.getState();
      expect(state.currentAyahId).toBeNull();
    });

    it("does nothing when at last ayah in queue but sets isPlaying to false so UI reflects playback ended", () => {
      const a1 = mockAyah("1:1", "/a1.mp3");
      usePlayerStore.getState().setQueue([a1]);
      usePlayerStore.getState().play(a1);
      expect(usePlayerStore.getState().isPlaying).toBe(true);
      const advanced = usePlayerStore.getState().next();
      const state = usePlayerStore.getState();
      expect(advanced).toBe(false);
      expect(state.currentAyahId).toBe("1:1");
      expect(state.isPlaying).toBe(false);
    });

    it("returns true when it advanced to next ayah", () => {
      const a1 = mockAyah("1:1", "/a1.mp3");
      const a2 = mockAyah("1:2", "/a2.mp3");
      usePlayerStore.getState().setQueue([a1, a2]);
      usePlayerStore.getState().play(a1);
      const advanced = usePlayerStore.getState().next();
      expect(advanced).toBe(true);
      expect(usePlayerStore.getState().currentAyahId).toBe("1:2");
    });

    it("returns false when at last ayah and did not advance", () => {
      const a1 = mockAyah("1:1", "/a1.mp3");
      usePlayerStore.getState().setQueue([a1]);
      usePlayerStore.getState().play(a1);
      const advanced = usePlayerStore.getState().next();
      expect(advanced).toBe(false);
    });
  });

  describe("restartFromFirst", () => {
    it("sets current to first ayah in queue and plays", () => {
      const a1 = mockAyah("1:1", "/a1.mp3");
      const a2 = mockAyah("1:2", "/a2.mp3");
      usePlayerStore.getState().setQueue([a1, a2]);
      usePlayerStore.getState().play(a2);
      usePlayerStore.getState().restartFromFirst();
      const state = usePlayerStore.getState();
      expect(state.currentAyahId).toBe("1:1");
      expect(state.activeAudioSrc).toBe("/a1.mp3");
      expect(state.isPlaying).toBe(true);
    });

    it("does nothing when queue is empty", () => {
      usePlayerStore.getState().restartFromFirst();
      const state = usePlayerStore.getState();
      expect(state.currentAyahId).toBeNull();
    });
  });

  describe("previous", () => {
    it("moves to previous ayah in queue and plays", () => {
      const a1 = mockAyah("1:1", "/a1.mp3");
      const a2 = mockAyah("1:2", "/a2.mp3");
      usePlayerStore.getState().setQueue([a1, a2]);
      usePlayerStore.getState().play(a2);
      usePlayerStore.getState().previous();
      const state = usePlayerStore.getState();
      expect(state.currentAyahId).toBe("1:1");
      expect(state.activeAudioSrc).toBe("/a1.mp3");
      expect(state.isPlaying).toBe(true);
    });

    it("does nothing when at first ayah in queue", () => {
      const a1 = mockAyah("1:1", "/a1.mp3");
      usePlayerStore.getState().setQueue([a1]);
      usePlayerStore.getState().play(a1);
      usePlayerStore.getState().previous();
      const state = usePlayerStore.getState();
      expect(state.currentAyahId).toBe("1:1");
    });
  });

  describe("setQueue", () => {
    it("replaces queue", () => {
      const ayahs = [
        mockAyah("1:1", "/a1.mp3"),
        mockAyah("1:2", "/a2.mp3"),
      ];
      usePlayerStore.getState().setQueue(ayahs);
      expect(usePlayerStore.getState().queue).toEqual(ayahs);
    });

    it("records a whole-surah queue by default", () => {
      usePlayerStore.getState().setQueue([mockAyah("1:1", "/a1.mp3")], "juz");
      usePlayerStore.getState().setQueue([mockAyah("1:1", "/a1.mp3")]);
      expect(usePlayerStore.getState().queueSource).toBe("surah");
    });

    it("records where a queue came from so the end of the queue can be handled per context", () => {
      usePlayerStore.getState().setQueue([mockAyah("2:252", "/b.mp3")], "juz");
      expect(usePlayerStore.getState().queueSource).toBe("juz");
    });
  });

  describe("queue source of ad-hoc playback", () => {
    it("play() of an ayah outside the current queue starts a single-ayah queue", () => {
      usePlayerStore.getState().setQueue([mockAyah("1:1", "/a1.mp3")]);
      usePlayerStore.getState().play(mockAyah("5:3", "/c.mp3"));
      expect(usePlayerStore.getState().queueSource).toBe("single");
    });

    it("playAyahIds() marks the queue as a dua", () => {
      usePlayerStore.getState().playAyahIds(["2:201"]);
      expect(usePlayerStore.getState().queueSource).toBe("dua");
    });
  });

  describe("setCurrentAyah", () => {
    it("sets current surah and ayah without starting playback", () => {
      const ayah = mockAyah("2:5", "/b5.mp3");
      usePlayerStore.getState().setCurrentAyah(ayah);
      const state = usePlayerStore.getState();
      expect(state.currentSurahId).toBe("2");
      expect(state.currentAyahId).toBe("2:5");
      expect(state.activeAudioSrc).toBeNull();
      expect(state.isPlaying).toBe(false);
    });

    it("allows next() to work without calling play() first", () => {
      const a1 = mockAyah("1:1", "/a1.mp3");
      const a2 = mockAyah("1:2", "/a2.mp3");
      usePlayerStore.getState().setQueue([a1, a2]);
      usePlayerStore.getState().setCurrentAyah(a1);
      usePlayerStore.getState().next();
      const state = usePlayerStore.getState();
      expect(state.currentAyahId).toBe("1:2");
    });
  });

  describe("goToAyah (navigation keeps the playback state, QA P2-2)", () => {
    const a1 = mockAyah("1:1", "/a1.mp3");
    const a2 = mockAyah("1:2", "/a2.mp3");

    it("with audio stopped moves to the ayah and loads no audio", () => {
      usePlayerStore.getState().setQueue([a1, a2], "learn");
      usePlayerStore.getState().setCurrentAyah(a1);
      usePlayerStore.getState().goToAyah(a2);
      const state = usePlayerStore.getState();
      expect(state.currentAyahId).toBe("1:2");
      expect(state.isPlaying).toBe(false);
      expect(state.activeAudioSrc).toBeNull();
    });

    it("while paused loads the ayah's audio and stays paused", () => {
      usePlayerStore.getState().setQueue([a1, a2], "learn");
      usePlayerStore.getState().play(a1);
      usePlayerStore.getState().pause();
      usePlayerStore.getState().goToAyah(a2);
      const state = usePlayerStore.getState();
      expect(state.currentAyahId).toBe("1:2");
      expect(state.isPlaying).toBe(false);
      expect(state.activeAudioSrc).toBe("/a2.mp3");
    });

    it("while playing continues playback at the ayah from its start", () => {
      usePlayerStore.getState().setQueue([a1, a2], "learn");
      usePlayerStore.getState().play(a1);
      usePlayerStore.setState({ currentTime: 4, currentTimeMs: 4000 });
      usePlayerStore.getState().goToAyah(a2);
      const state = usePlayerStore.getState();
      expect(state.currentAyahId).toBe("1:2");
      expect(state.isPlaying).toBe(true);
      expect(state.activeAudioSrc).toBe("/a2.mp3");
      expect(state.currentTimeMs).toBe(0);
      expect(state.queueSource).toBe("learn");
    });
  });

  describe("setCurrentTime and setDuration", () => {
    it("updates currentTime and duration", () => {
      usePlayerStore.getState().setCurrentTime(5.2);
      usePlayerStore.getState().setDuration(30);
      const state = usePlayerStore.getState();
      expect(state.currentTime).toBe(5.2);
      expect(state.duration).toBe(30);
    });
  });

  describe("playAyahIds", () => {
    it("plays single ayah by id and sets queue with one ayah", () => {
      usePlayerStore.getState().playAyahIds(["3:192"]);
      const state = usePlayerStore.getState();
      expect(state.currentAyahId).toBe("3:192");
      expect(state.currentSurahId).toBe("3");
      expect(state.isPlaying).toBe(true);
      expect(state.queue).toHaveLength(1);
      expect(state.queue[0].id).toBe("3:192");
      expect(state.activeAudioSrc).toContain("003192.mp3");
    });

    it("plays multiple ayahs as queue (for merged dua) and starts with first", () => {
      usePlayerStore.getState().playAyahIds(["3:191", "3:192", "3:193", "3:194"]);
      const state = usePlayerStore.getState();
      expect(state.currentAyahId).toBe("3:191");
      expect(state.queue).toHaveLength(4);
      expect(state.queue.map((a) => a.id)).toEqual(["3:191", "3:192", "3:193", "3:194"]);
      expect(state.activeAudioSrc).toContain("003191.mp3");
      expect(state.isPlaying).toBe(true);
    });

    it("does nothing when given empty array", () => {
      usePlayerStore.getState().playAyahIds([]);
      const state = usePlayerStore.getState();
      expect(state.activeAudioSrc).toBeNull();
      expect(state.queue).toHaveLength(0);
    });
  });

  // QA P1-2 / P1-10: word-by-word is a display mode; audio stays the per-ayah file,
  // so ayah boundaries and repeat run on `ended` (works in a background tab).
  describe("word-by-word mode", () => {
    const leftoverChapterState = {
      wordByWordMode: true,
      chapterAudioUrl: "https://download.quranicaudio.com/qdc/mishari_al_afasy/murattal/1.mp3",
      chapterTimestamps: [
        { verseKey: "1:2", timestampFrom: 6090, timestampTo: 11680, segments: [] },
        { verseKey: "1:3", timestampFrom: 11680, timestampTo: 16300, segments: [] },
      ],
    };
    const a2 = mockAyah("1:2", "");
    const a3 = mockAyah("1:3", "");

    it("play in word-by-word mode uses the per-ayah file", () => {
      usePlayerStore.setState(leftoverChapterState as never);
      usePlayerStore.getState().setQueue([a2, a3]);
      usePlayerStore.getState().play(a2);
      const state = usePlayerStore.getState();
      expect(state.activeAudioSrc).toBe("/audio/mishary-alafasy/001002.mp3");
      expect(state.pendingSeekToSeconds).toBeNull();
    });

    it("next in word-by-word mode uses the per-ayah file", () => {
      usePlayerStore.setState(leftoverChapterState as never);
      usePlayerStore.getState().setQueue([a2, a3]);
      usePlayerStore.getState().play(a2);
      usePlayerStore.getState().next();
      const state = usePlayerStore.getState();
      expect(state.activeAudioSrc).toBe("/audio/mishary-alafasy/001003.mp3");
      expect(state.pendingSeekToSeconds).toBeNull();
    });

    it("switching ayah resets the playback time so no stale word is highlighted", () => {
      usePlayerStore.getState().setQueue([a2, a3]);
      usePlayerStore.getState().play(a2);
      usePlayerStore.setState({ currentTime: 5.4, currentTimeMs: 5400 });
      usePlayerStore.getState().next();
      expect(usePlayerStore.getState()).toMatchObject({ currentTime: 0, currentTimeMs: 0 });

      usePlayerStore.setState({ currentTime: 3, currentTimeMs: 3000 });
      usePlayerStore.getState().previous();
      expect(usePlayerStore.getState()).toMatchObject({ currentTime: 0, currentTimeMs: 0 });

      usePlayerStore.setState({ currentTime: 3, currentTimeMs: 3000 });
      usePlayerStore.getState().setCurrentAyah(a3);
      expect(usePlayerStore.getState()).toMatchObject({ currentTime: 0, currentTimeMs: 0 });

      usePlayerStore.setState({ currentTime: 3, currentTimeMs: 3000 });
      usePlayerStore.getState().play(a2);
      expect(usePlayerStore.getState()).toMatchObject({ currentTime: 0, currentTimeMs: 0 });

      usePlayerStore.setState({ currentTime: 3, currentTimeMs: 3000 });
      usePlayerStore.getState().restartFromFirst();
      expect(usePlayerStore.getState()).toMatchObject({ currentTime: 0, currentTimeMs: 0 });
    });

    it("toggling word-by-word does not change the active source", () => {
      usePlayerStore.getState().setQueue([a2, a3]);
      usePlayerStore.getState().play(a2);
      const before = usePlayerStore.getState().activeAudioSrc;
      usePlayerStore.getState().setWordByWordMode(true);
      expect(usePlayerStore.getState().activeAudioSrc).toBe(before);
      expect(usePlayerStore.getState().isPlaying).toBe(true);
      usePlayerStore.getState().setWordByWordMode(false);
      expect(usePlayerStore.getState().activeAudioSrc).toBe(before);
    });
  });
});
