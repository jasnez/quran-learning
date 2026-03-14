"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { useAuthStore } from "@/store/authStore";
import { getBrowserClientAsync, ensureUserProfileAndSettings } from "@/lib/auth/authHelpers";
import {
  syncBookmarksToCloud,
  syncProgressToCloud,
  syncSettingsToCloud,
  loadUserDataFromCloud,
  loadBookmarksFromCloud,
  loadProgressFromCloud,
} from "@/lib/sync/dataSyncService";
import { clearLocalProgress } from "@/store/progressStore";

function isEmailConfirmed(user: User): boolean {
  return !!user.email_confirmed_at;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const currentUserId = useAuthStore((s) => s.user?.id ?? null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let isCancelled = false;
    let didRunInitialSync = false;
    let unsubscribe: (() => void) | null = null;

    const runInitialSync = async (user: User) => {
      if (didRunInitialSync) return;
      didRunInitialSync = true;
      clearLocalProgress();
      await loadBookmarksFromCloud(user.id);
      await loadUserDataFromCloud(user.id);
      await loadProgressFromCloud(user.id);
    };

    const handleUser = async (user: User | null) => {
      setUser(user);
      if (!user) return;
      if (!isEmailConfirmed(user) && pathname !== "/auth/confirm-email") {
        router.replace("/auth/confirm-email");
        return;
      }
      if (!isEmailConfirmed(user)) return;
      await ensureUserProfileAndSettings(user);
      await runInitialSync(user);
    };

    void getBrowserClientAsync().then((client) => {
      if (isCancelled) return;
      void client.auth.getUser().then(async ({ data, error }) => {
        if (isCancelled || error) return;
        const user = (data?.user ?? null) as User | null;
        await handleUser(user);
      });

      const {
        data: { subscription },
      } = client.auth.onAuthStateChange((_event, session) => {
        const user = (session?.user ?? null) as User | null;
        void handleUser(user);
      });
      unsubscribe = () => subscription.unsubscribe();
    });

    return () => {
      isCancelled = true;
      unsubscribe?.();
    };
  }, [setUser, router, pathname]);

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

