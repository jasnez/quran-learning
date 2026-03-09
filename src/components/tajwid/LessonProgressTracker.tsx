"use client";

import { useEffect } from "react";
import { useProgressStore } from "@/store/progressStore";

export function LessonProgressTracker({ lessonSlug }: { lessonSlug: string }) {
  const markStarted = useProgressStore((s) => s.markTajwidLessonStarted);
  const status = useProgressStore((s) => s.getTajwidLessonStatus(lessonSlug));

  useEffect(() => {
    if (status?.status !== "completed") {
      markStarted(lessonSlug);
    }
  }, [lessonSlug, markStarted, status?.status]);

  return null;
}
