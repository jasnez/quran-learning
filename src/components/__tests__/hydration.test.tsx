/**
 * @vitest-environment jsdom
 */
// Regression tests for QA P1-6: every component that reads a persisted store
// (localStorage) or the current date must hydrate the static HTML without a
// mismatch (React #418). The HTML is rendered with the stores' initial state,
// as `next build` does; the client already has the user's data.
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { collectHydrationErrors } from "@/test-utils/hydration";
import { useProgressStore } from "@/store/progressStore";
import { useBookmarkStore } from "@/store/bookmarkStore";
import surahsData from "@/data/surahs.json";
import fatiha from "@/data/ayahs/001-al-fatiha.json";
import { getAllJuz } from "@/lib/data/juzUtils";
import { getAllTajwidLessons, type TajwidLesson } from "@/data/tajwid-lessons";
import type { Ayah, SurahSummary } from "@/types/quran";
import { SurahFrame } from "../reader/SurahFrame";
import { AyahCard } from "../reader/AyahCard";
import { SurahListItem } from "../surahs/SurahListItem";
import { JuzListCard } from "../surahs/JuzListCard";
import { BookmarksContent } from "../bookmarks/BookmarksContent";
import { ProgressContent } from "../progress/ProgressContent";
import { ContinueLearningSection } from "../home/ContinueLearningSection";
import { DailyDuaSection } from "../home/DailyDuaSection";
import { TajwidLessonCard } from "../tajwid/TajwidLessonCard";
import { LessonProgressTracker } from "../tajwid/LessonProgressTracker";
import { LearnModeContent } from "../learn/LearnModeContent";

const surahs = surahsData as SurahSummary[];
const fatihaSurah = fatiha.surah as SurahSummary;
const fatihaAyahs = fatiha.ayahs as unknown as Ayah[];

function resetStores() {
  useProgressStore.setState(useProgressStore.getInitialState(), true);
  useBookmarkStore.setState(useBookmarkStore.getInitialState(), true);
  localStorage.clear();
}

let tajwidLesson: TajwidLesson;

/**
 * Puts user data into the stores the way localStorage hydration does on the
 * client. Runs only after the "server" render: a real build has no user data.
 */
function seedUserData() {
  const progress = useProgressStore.getState();
  progress.markAyahListened(1, 1);
  progress.markAyahListened(1, 2);
  progress.markAyahRead(1, 1);
  progress.addSurahVisited(1);
  progress.updateLastPosition(1, 2, "Al-Fatihah", "reader");
  progress.markTajwidLessonStarted(tajwidLesson.slug);
  useBookmarkStore
    .getState()
    .addBookmark(1, 1, "Al-Fatihah", fatihaAyahs[0].arabicText, fatihaAyahs[0].translationBosnian);
}

const CLIENT = { beforeHydrate: seedUserData };

describe("hydration with data from localStorage (P1-6)", () => {
  beforeAll(async () => {
    [tajwidLesson] = await getAllTajwidLessons();
  });
  beforeEach(resetStores);
  afterEach(resetStores);

  it("SurahFrame (listened-ayah counter)", async () => {
    expect(await collectHydrationErrors(<SurahFrame surah={fatihaSurah} ayahs={fatihaAyahs} />, CLIENT)).toEqual([]);
  });

  it("AyahCard (bookmark button state)", async () => {
    const ui = (
      <AyahCard
        ayah={fatihaAyahs[0]}
        queueAyahs={fatihaAyahs}
        surahNameLatin="Al-Fatihah"
        arabicFontSize={32}
        showTransliteration
        showTranslation
        showTajwidColors
      />
    );
    expect(await collectHydrationErrors(ui, CLIENT)).toEqual([]);
  });

  it("SurahListItem (/surahs progress bar)", async () => {
    expect(await collectHydrationErrors(<SurahListItem surah={surahs[0]} />, CLIENT)).toEqual([]);
  });

  it("JuzListCard (juz progress)", async () => {
    expect(await collectHydrationErrors(<JuzListCard juz={getAllJuz()[0]} allSurahs={surahs} />, CLIENT)).toEqual([]);
  });

  it("BookmarksContent (/bookmarks list)", async () => {
    expect(await collectHydrationErrors(<BookmarksContent surahs={surahs} />, CLIENT)).toEqual([]);
  });

  it("ProgressContent (/progress overview)", async () => {
    expect(await collectHydrationErrors(<ProgressContent surahs={surahs} />, CLIENT)).toEqual([]);
  });

  it("ContinueLearningSection (home)", async () => {
    expect(await collectHydrationErrors(<ContinueLearningSection />, CLIENT)).toEqual([]);
  });

  it("TajwidLessonCard and LessonProgressTracker (lesson status)", async () => {
    expect(await collectHydrationErrors(<TajwidLessonCard lesson={tajwidLesson} index={0} />, CLIENT)).toEqual([]);
    resetStores();
    expect(await collectHydrationErrors(<LessonProgressTracker lessonSlug={tajwidLesson.slug} />, CLIENT)).toEqual(
      [],
    );
  });

  it("LearnModeContent (bookmark button state)", async () => {
    expect(await collectHydrationErrors(<LearnModeContent surah={fatihaSurah} ayahs={fatihaAyahs} />, CLIENT)).toEqual(
      [],
    );
  });
});

describe("DailyDuaSection hydration (P1-6)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not depend on the build date", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    // Build day and visit day pick different duas.
    vi.setSystemTime(new Date("2026-05-19T12:00:00Z"));
    const errors = await collectHydrationErrors(<DailyDuaSection />, {
      beforeHydrate: () => vi.setSystemTime(new Date("2026-11-16T12:00:00Z")),
    });
    expect(errors).toEqual([]);
  });
});
