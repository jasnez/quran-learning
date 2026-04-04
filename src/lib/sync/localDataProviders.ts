import type { Bookmark } from "@/types/bookmarks";
import type { LearningProgress } from "@/store/progressStore";
import type { SettingsState } from "@/types/settings";
import { useBookmarkStore, BOOKMARK_STORAGE_KEY } from "@/store/bookmarkStore";
import { useProgressStore, PROGRESS_STORAGE_KEY } from "@/store/progressStore";
import { useSettingsStore, SETTINGS_STORAGE_KEY } from "@/store/settingsStore";
import { getSafeStorage } from "@/store/safeStorage";

/**
 * These helpers centralize how we read current local data for sync purposes.
 * They are intentionally simple so tests can mock them.
 */

export function getLocalBookmarks(): Bookmark[] {
  try {
    // Prefer in-memory state if available
    const state = useBookmarkStore.getState?.();
    if (state && Array.isArray(state.bookmarks)) {
      return state.bookmarks;
    }
  } catch {
    // fall back to storage
  }

  try {
    const storage = getSafeStorage();
    const raw = storage.getItem(BOOKMARK_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { state?: { bookmarks?: Bookmark[] } } | undefined;
    return parsed?.state?.bookmarks ?? [];
  } catch {
    return [];
  }
}

export function getLocalProgress(): LearningProgress | null {
  try {
    const state = useProgressStore.getState?.();
    if (state && typeof state === "object") {
      const { updateLastPosition, incrementListeningTime, addSurahVisited, incrementAyahsListened, markAyahListened, markAyahRead, addSurahTimeSpent, getSurahProgress, getAllSurahProgress, getOverallProgress, getLastPosition, getStats, markTajwidLessonStarted, markTajwidLessonCompleted, getTajwidLessonStatus, addTestResult, getTestResultsForSurah, ...rest } =
        state;
      return rest as LearningProgress;
    }
  } catch {
    // ignore
  }

  try {
    const storage = getSafeStorage();
    const raw = storage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: Partial<LearningProgress> } | undefined;
    return (parsed?.state as LearningProgress) ?? null;
  } catch {
    return null;
  }
}

export function getLocalSettings(): SettingsState | null {
  try {
    const state = useSettingsStore.getState?.();
    if (state && typeof state === "object") {
      const {
        setTheme,
        setArabicFontSize,
        setArabicFontStyle,
        toggleTransliteration,
        toggleTranslation,
        toggleTajwidColors,
        setReciter,
        setPlaybackSpeed,
        cycleRepeatMode,
        toggleAutoPlayNext,
        ...rest
      } = state;
      return rest as SettingsState;
    }
  } catch {
    // ignore
  }

  try {
    const storage = getSafeStorage();
    const raw = storage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: SettingsState } | undefined;
    return parsed?.state ?? null;
  } catch {
    return null;
  }
}

