"use client";

import { useEffect } from "react";
import { BOOKMARK_STORAGE_KEY, useBookmarkStore } from "@/store/bookmarkStore";
import { PROGRESS_STORAGE_KEY, useProgressStore } from "@/store/progressStore";
import { getSafeStorage } from "@/store/safeStorage";

/** True once bookmarks or progress were saved (the stores write their key on the first change). */
function hasSavedData(): boolean {
  const storage = getSafeStorage();
  return storage.getItem(BOOKMARK_STORAGE_KEY) !== null || storage.getItem(PROGRESS_STORAGE_KEY) !== null;
}

/**
 * Asks the browser not to evict this site's storage (bookmarks and progress live only in
 * localStorage; QA section 7). Chrome and Safari decide without asking the user (Safari mostly
 * grants it to a Home Screen web app); Firefox asks. So the request waits until the visitor has
 * saved something, and runs at most once per page load.
 */
export function PersistentStorageRequest() {
  useEffect(() => {
    if (!navigator.storage?.persist) return;

    const request = () => {
      navigator.storage
        .persisted()
        .then((persisted) => (persisted ? true : navigator.storage.persist()))
        .catch((err: unknown) => {
          console.warn("Could not request persistent storage", err);
        });
    };

    if (hasSavedData()) {
      request();
      return;
    }
    let done = false;
    const stop = () => {
      done = true;
      unsubscribeBookmarks();
      unsubscribeProgress();
    };
    const onChange = () => {
      // The persist middleware writes localStorage right after it notifies subscribers.
      queueMicrotask(() => {
        if (done || !hasSavedData()) return;
        stop();
        request();
      });
    };
    const unsubscribeBookmarks = useBookmarkStore.subscribe(onChange);
    const unsubscribeProgress = useProgressStore.subscribe(onChange);
    return stop;
  }, []);

  return null;
}
