/**
 * @vitest-environment jsdom
 *
 * Playing an ayah in the juz reader must queue the whole juz (across surah
 * boundaries) and mark it as a juz queue, so playback neither stops at the end
 * of a surah segment nor jumps to the next surah outside the juz.
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { JuzReaderContent } from "../JuzReaderContent";
import { usePlayerStore } from "@/store/playerStore";
import type { Ayah, JuzInfo, SurahSummary } from "@/types/quran";

vi.mock("@/lib/audio/audioManager", () => ({
  play: () => Promise.resolve(),
  pause: () => {},
  seek: () => {},
}));

const ayah = (id: string): Ayah =>
  ({
    id,
    ayahNumber: Number(id.split(":")[1]),
    ayahNumberGlobal: 0,
    juz: 1,
    page: 1,
    arabicText: "بِسْمِ",
    transliteration: "",
    translationBosnian: "",
    tajwidSegments: [{ text: "بِسْمِ", rule: "normal" }],
    audio: { reciterId: "mishary-alafasy", url: "", durationMs: 0 },
  }) as Ayah;

const surah = (n: number, ayahCount: number): SurahSummary => ({
  id: String(n),
  surahNumber: n,
  slug: `s${n}`,
  nameArabic: "",
  nameLatin: `Surah ${n}`,
  nameBosnian: "",
  revelationType: "meccan",
  ayahCount,
});

const juz: JuzInfo = {
  juz: 1,
  name: "Elif-Lām-Mīm",
  nameArabic: "",
  start: "1:6",
  end: "2:2",
  startSurah: 1,
  startAyah: 6,
  endSurah: 2,
  endAyah: 2,
  surahsIncluded: [1, 2],
};

describe("JuzReaderContent playback queue", () => {
  beforeEach(() => {
    usePlayerStore.setState({ queue: [], queueSource: "surah", currentAyahId: null, isPlaying: false, activeAudioSrc: null });
  });

  afterEach(() => {
    cleanup();
  });

  it("queues every ayah of the juz across surahs as a juz queue", async () => {
    render(
      <JuzReaderContent
        juz={juz}
        segments={[
          { surah: surah(1, 7), ayahs: [ayah("1:6"), ayah("1:7")] },
          { surah: surah(2, 286), ayahs: [ayah("2:1"), ayah("2:2")] },
        ]}
      />
    );

    const card = document.querySelector('[data-ayah-id="1:7"]') as HTMLElement;
    await userEvent.click(within(card).getByRole("button", { name: "Pusti 7. ajet sure Surah 1" }));

    const state = usePlayerStore.getState();
    expect(state.queue.map((a) => a.id)).toEqual(["1:6", "1:7", "2:1", "2:2"]);
    expect(state.queueSource).toBe("juz");
    expect(state.currentAyahId).toBe("1:7");
    expect(screen.getAllByRole("button", { name: /^(Pusti|Pauziraj) \d+\. ajet sure Surah \d$/ }).length).toBeGreaterThan(0);
  });

  it("renders the playing ayah even when playback has moved past the loaded page of 20 ayahs", () => {
    const ayahs = Array.from({ length: 25 }, (_, i) => ayah(`2:${i + 1}`));
    usePlayerStore.setState({ queue: ayahs, queueSource: "juz", currentAyahId: "2:23", isPlaying: true });

    render(<JuzReaderContent juz={juz} segments={[{ surah: surah(2, 286), ayahs }]} />);

    expect(document.querySelector('[data-ayah-id="2:23"]')).toBeInTheDocument();
    expect(document.querySelector('[data-ayah-id="2:25"]')).not.toBeInTheDocument();
  });
});

describe("JuzReaderContent layout", () => {
  afterEach(cleanup);

  it("starts each surah with a small frame (an h2) and keeps the juz links for the end", () => {
    const { container } = render(
      <JuzReaderContent
        juz={{ ...juz, juz: 2 }}
        segments={[
          { surah: surah(1, 7), ayahs: [ayah("1:6"), ayah("1:7")] },
          { surah: surah(2, 286), ayahs: [ayah("2:1"), ayah("2:2")] },
        ]}
      />,
    );
    const frames = container.querySelectorAll("[data-surah-frame]");
    expect(frames).toHaveLength(2);
    expect(screen.getByRole("heading", { level: 2, name: /Surah 1/ })).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Susjedni džuzevi" });
    const units = container.querySelectorAll("[data-ayah-id]");
    expect(units[units.length - 1].compareDocumentPosition(nav) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(container.querySelector("nav")).toBe(nav);
  });
});
