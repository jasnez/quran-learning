import Link from "next/link";
import type { ReactElement } from "react";
import { getServerUserRequireConfirmed, getServerSupabaseClient } from "@/lib/auth/serverAuth";
import { getProfile } from "@/lib/profile/getProfile";
import { getProfileStats } from "@/lib/profile/profileStats";
import { formatListeningTime } from "@/lib/formatListeningTime";
import { formatLongestStreak } from "@/lib/profile/formatProfileStats";
import { DeleteAccountButton } from "./DeleteAccountButton";
import { ProfileHeaderEdit } from "./ProfileHeaderEdit";

export default async function ProfilePage(): Promise<ReactElement> {
  const [user, supabase] = await Promise.all([
    getServerUserRequireConfirmed(),
    getServerSupabaseClient(),
  ]);

  const [profile, stats] = await Promise.all([
    getProfile(user.id),
    getProfileStats(user.id, supabase ?? undefined),
  ]);

  const fallbackDisplayName =
    (user.user_metadata as { full_name?: string })?.full_name ||
    user.email?.split("@")[0] ||
    "Korisnik";
  const displayName = profile.displayName ?? fallbackDisplayName;

  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString("bs-BA", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <ProfileHeaderEdit
        initialDisplayName={displayName}
        initialAvatarUrl={profile.avatarUrl}
        email={user.email ?? ""}
        memberSince={memberSince}
      />

      <section className="mb-8 grid gap-4 rounded-3xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-6 shadow-sm sm:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
            Sažetak učenja
          </h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex items-baseline justify-between">
              <dt className="text-stone-500 dark:text-stone-400">
                Ukupno sura započetih
              </dt>
              <dd className="font-semibold text-stone-900 dark:text-stone-50">
                {stats.totalSurahsStarted}
              </dd>
            </div>
            <div className="flex items-baseline justify-between">
              <dt className="text-stone-500 dark:text-stone-400">
                Završene sure
              </dt>
              <dd className="font-semibold text-stone-900 dark:text-stone-50">
                {stats.totalSurahsCompleted}
              </dd>
            </div>
            <div className="flex items-baseline justify-between">
              <dt className="text-stone-500 dark:text-stone-400">
                Ukupno preslušanih ajeta
              </dt>
              <dd className="font-semibold text-stone-900 dark:text-stone-50">
                {stats.totalAyahsListened}
              </dd>
            </div>
            <div className="flex items-baseline justify-between">
              <dt className="text-stone-500 dark:text-stone-400">
                Ukupno vrijeme slušanja
              </dt>
              <dd className="font-semibold text-stone-900 dark:text-stone-50">
                {formatListeningTime(stats.totalListeningTimeMs)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between">
              <dt className="text-stone-500 dark:text-stone-400">
                Najduži niz dana zaredom
              </dt>
              <dd className="font-semibold text-stone-900 dark:text-stone-50">
                {formatLongestStreak(stats.longestStreakDays)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between">
              <dt className="text-stone-500 dark:text-stone-400">
                Najčešće slušana sura
              </dt>
              <dd className="font-semibold text-stone-900 dark:text-stone-50">
                {stats.favoriteSurahName ?? "—"}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="mb-8 grid gap-4 sm:grid-cols-3">
        <a
          href="/bookmarks"
          className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-4 text-sm shadow-sm transition hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20"
        >
          <h3 className="font-semibold text-stone-900 dark:text-stone-50">
            Zabilješke
          </h3>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            Brz pristup označenim ajetima.
          </p>
        </a>
        <a
          href="/progress"
          className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-4 text-sm shadow-sm transition hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20"
        >
          <h3 className="font-semibold text-stone-900 dark:text-stone-50">
            Napredak
          </h3>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            Detaljan pregled tvog učenja po surama.
          </p>
        </a>
        <a
          href="/settings"
          className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-4 text-sm shadow-sm transition hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20"
        >
          <h3 className="font-semibold text-stone-900 dark:text-stone-50">
            Postavke
          </h3>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            Prilagodi prikaz i reprodukciju.
          </p>
        </a>
      </section>

      <section className="rounded-3xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
          Račun
        </h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/profile/change-password"
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-[var(--theme-border)] px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-emerald-500 hover:text-emerald-700 dark:text-stone-100 dark:hover:text-emerald-300"
          >
            Promijeni lozinku
          </Link>
          <DeleteAccountButton />
        </div>
      </section>
    </main>
  );
}

