/**
 * @vitest-environment jsdom
 *
 * QA P2-8: a tajwid lesson was marked "Završeno" even with 0/5 correct, and a retake overwrote a
 * better result. The owner chose: a lesson is completed from 60 % correct, and the best result
 * is kept.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useProgressStore, PROGRESS_STORAGE_KEY, isTajwidQuizPassed, tajwidQuizPassScore } from "../progressStore";

const slug = "lesson-2-mad";

describe("tajwid quiz pass rule", () => {
  it("passes from 60 % correct", () => {
    expect(tajwidQuizPassScore(5)).toBe(3);
    expect(tajwidQuizPassScore(6)).toBe(4);
    expect(isTajwidQuizPassed(2, 5)).toBe(false);
    expect(isTajwidQuizPassed(3, 5)).toBe(true);
    expect(isTajwidQuizPassed(3, 6)).toBe(false);
    expect(isTajwidQuizPassed(0, 0)).toBe(false);
  });
});

describe("recordTajwidQuizResult", () => {
  beforeEach(() => {
    localStorage.clear();
    useProgressStore.setState({ tajwidLessonProgress: {} });
  });

  const lesson = () => useProgressStore.getState().tajwidLessonProgress[slug];

  it("keeps a lesson in progress below the pass mark, with the score", () => {
    useProgressStore.getState().recordTajwidQuizResult(slug, 2, 5);
    expect(lesson()).toEqual({ status: "in_progress", quizScore: 2, quizTotal: 5 });
  });

  it("completes a lesson at the pass mark", () => {
    useProgressStore.getState().recordTajwidQuizResult(slug, 3, 5);
    expect(lesson().status).toBe("completed");
    expect(lesson().quizScore).toBe(3);
    expect(lesson().completedAt).toBeDefined();
  });

  it("keeps the better result when a retake scores lower", () => {
    useProgressStore.getState().recordTajwidQuizResult(slug, 4, 5);
    const completedAt = lesson().completedAt;
    useProgressStore.getState().recordTajwidQuizResult(slug, 1, 5);
    expect(lesson()).toEqual({ status: "completed", quizScore: 4, quizTotal: 5, completedAt });
  });

  it("raises the result when a retake scores higher", () => {
    useProgressStore.getState().recordTajwidQuizResult(slug, 1, 5);
    useProgressStore.getState().recordTajwidQuizResult(slug, 2, 5);
    expect(lesson()).toEqual({ status: "in_progress", quizScore: 2, quizTotal: 5 });
    useProgressStore.getState().recordTajwidQuizResult(slug, 5, 5);
    expect(lesson().status).toBe("completed");
    expect(lesson().quizScore).toBe(5);
  });

  it("starting the lesson again does not undo a completed lesson", () => {
    useProgressStore.getState().recordTajwidQuizResult(slug, 3, 5);
    useProgressStore.getState().markTajwidLessonStarted(slug);
    expect(lesson().status).toBe("completed");
  });
});

describe("tajwid results saved before the pass mark", () => {
  beforeEach(() => {
    localStorage.clear();
    useProgressStore.setState({ tajwidLessonProgress: {} });
  });

  function save(tajwidLessonProgress: Record<string, unknown>) {
    localStorage.setItem(
      PROGRESS_STORAGE_KEY,
      JSON.stringify({ state: { surahProgressMap: {}, tajwidLessonProgress }, version: 0 }),
    );
  }

  it("turns a completed lesson below the pass mark back into one in progress", async () => {
    save({ [slug]: { status: "completed", quizScore: 0, quizTotal: 5, completedAt: "2026-11-10T10:00:00.000Z" } });
    await useProgressStore.persist.rehydrate();
    expect(useProgressStore.getState().tajwidLessonProgress[slug]).toEqual({
      status: "in_progress",
      quizScore: 0,
      quizTotal: 5,
    });
  });

  it("keeps a completed lesson at or above the pass mark", async () => {
    const passed = { status: "completed", quizScore: 3, quizTotal: 5, completedAt: "2026-11-10T10:00:00.000Z" };
    save({ [slug]: passed });
    await useProgressStore.persist.rehydrate();
    expect(useProgressStore.getState().tajwidLessonProgress[slug]).toEqual(passed);
  });
});
