"use client";

import { useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { useAuthStore } from "@/store/authStore";
import { ensureUserProfileAndSettings } from "@/lib/auth/authHelpers";
import {
  syncBookmarksToCloud,
  syncProgressToCloud,
  syncSettingsToCloud,
  mergeLocalAndCloudData,
  loadUserDataFromCloud,
  loadBookmarksFromCloud,
  loadProgressFromCloud,
} from "@/lib/sync/dataSyncService";

let browserClient:
  | ReturnType<typeof createBrowserClient<User>>
  | null = null;

function getBrowserClient() {
  if (browserClient) return browserClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  browserClient = createBrowserClient(url, anonKey);
  return browserClient;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const currentUserId = useAuthStore((s) => s.user?.id ?? null);

  useEffect(() => {
    const client = getBrowserClient();
    let isCancelled = false;
    let didRunInitialSync = false;

    const runInitialSync = async (user: User) => {
      if (didRunInitialSync) return;
      didRunInitialSync = true;
      await mergeLocalAndCloudData(user.id);
      await Promise.all([
        syncBookmarksToCloud(user.id),
        syncSettingsToCloud(user.id),
        syncProgressToCloud(user.id),
      ]);
      await loadBookmarksFromCloud(user.id);
      await loadUserDataFromCloud(user.id);
      await loadProgressFromCloud(user.id);
    };

    void client.auth.getUser().then(async ({ data, error }) => {
      if (isCancelled || error) return;
      const user = data?.user ?? null;
      setUser(user as User | null);
      if (user) {
        await ensureUserProfileAndSettings(user as User);
        await runInitialSync(user as User);
      }
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      const user = (session?.user ?? null) as User | null;
      setUser(user);
      if (user) {
        void ensureUserProfileAndSettings(user);
        void runInitialSync(user);
      }
    });

    return () => {
      isCancelled = true;
      subscription.unsubscribe();
    };
  }, [setUser]);

  useEffect(() => {
    if (!currentUserId) return;

    const runPeriodicSync = () => {
      void Promise.all([
        syncBookmarksToCloud(currentUserId),
        syncSettingsToCloud(currentUserId),
        syncProgressToCloud(currentUserId),
      ]);
    };

    const intervalId = window.setInterval(runPeriodicSync, 5 * 60 * 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [currentUserId]);

  return <>{children}</>;
}

