"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { usePlayerStore } from "@/store/playerStore";
import { useAuthStore } from "@/store/authStore";
import { signOut } from "@/lib/auth/authHelpers";
import { useSettingsOpen } from "@/contexts/SettingsOpenContext";
import { useStickyHeader } from "./useStickyHeader";

const BRAND_COLOR = "text-stone-800 dark:text-stone-100";
const LINK_HOVER = "hover:text-emerald-800 dark:hover:text-emerald-200";
const ICON_BTN =
  "flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200 sm:min-h-[36px] sm:min-w-[36px]";
const TEXT_LINK =
  "hidden text-sm font-medium text-stone-600 transition-colors dark:text-stone-400 sm:inline-flex sm:py-2 sm:px-1 " +
  LINK_HOVER;
const SEPARATOR =
  "hidden h-5 w-px shrink-0 bg-[var(--theme-border)] sm:block";

export function Header() {
  const { isOpen: settingsOpen, open: openSettings } = useSettingsOpen();
  const pathname = usePathname();
  const isSurahPage = pathname?.startsWith("/surah/");
  const activeAudioSrc = usePlayerStore((s) => s.activeAudioSrc);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const resume = usePlayerStore((s) => s.resume);
  const pause = usePlayerStore((s) => s.pause);
  const { isHidden, hasShadow } = useStickyHeader();
  const user = useAuthStore((s) => s.user);
  const authed = !!user;

  return (
    <header
      role="banner"
      data-hidden={isHidden ? "true" : "false"}
      className={`fixed left-0 right-0 top-0 z-50 border-b border-[var(--theme-border)] bg-[var(--theme-card)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--theme-card)]/90 transition-transform duration-200 will-change-transform ${
        hasShadow ? "shadow-sm" : ""
      } ${isHidden ? "-translate-y-full" : ""}`}
    >
      <div className="mx-auto flex h-12 max-h-[52px] max-w-4xl items-center justify-between gap-6 px-4 sm:px-5">
        {/* Brand */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {isSurahPage && (
            <Link
              href="/surahs"
              className={`${ICON_BTN} shrink-0`}
              aria-label="Nazad na listu sura"
            >
              <BackIcon className="h-5 w-5" />
            </Link>
          )}
          <Link
            href="/"
            className={`min-w-0 truncate text-base font-semibold sm:text-[1.05rem] ${BRAND_COLOR} transition-colors ${LINK_HOVER}`}
            aria-label="Quran Learning home"
          >
            Quran Learning
          </Link>
        </div>

        {/* Navigation */}
        <nav
          className="flex flex-shrink-0 items-center gap-3 sm:gap-4"
          aria-label="Main navigation"
        >
          {activeAudioSrc && (
            <>
              <button
                type="button"
                className={ICON_BTN}
                aria-label={isPlaying ? "Pauza" : "Pusti"}
                onClick={() => (isPlaying ? pause() : resume())}
              >
                {isPlaying ? (
                  <PauseIcon className="h-5 w-5" />
                ) : (
                  <PlayIcon className="h-5 w-5" />
                )}
              </button>
              <span role="separator" aria-hidden className={SEPARATOR} />
            </>
          )}

          <div className="hidden items-center gap-5 sm:flex">
            <Link href="/surahs" className={TEXT_LINK}>
              Sure
            </Link>
            <Link href="/test/1" className={TEXT_LINK}>
              Kviz
            </Link>
            <Link href="/tajwid" className={TEXT_LINK}>
              Tedžvid lekcije
            </Link>
            <Link href="/progress" className={TEXT_LINK}>
              Napredak
            </Link>
          </div>

          <span role="separator" aria-hidden className={SEPARATOR} />

          <div className="flex items-center gap-1 sm:gap-2">
            <Link href="/search" className={ICON_BTN} aria-label="Pretraga">
              <SearchIcon className="h-5 w-5" />
            </Link>
            <Link href="/bookmarks" className={ICON_BTN} aria-label="Označeni ajeti">
              <BookmarkNavIcon className="h-5 w-5" />
            </Link>
            <button
              type="button"
              className={ICON_BTN}
              aria-label="Settings"
              aria-expanded={settingsOpen}
              onClick={() => openSettings()}
            >
              <SettingsIcon className="h-5 w-5" />
            </button>
            {authed && user ? (
              <UserMenuButton userName={getUserDisplayName(user)} />
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className={`${ICON_BTN} sm:hidden`}
                  aria-label="Prijava"
                >
                  <UserIcon className="h-5 w-5" />
                </Link>
                <Link href="/auth/login" className={TEXT_LINK}>
                  Prijava
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}

type UserMenuButtonProps = {
  userName: string;
};

function UserMenuButton({ userName }: UserMenuButtonProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const closeMenu = React.useCallback(() => setOpen(false), []);

  return (
    <div className="relative">
      <button
        type="button"
        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-full bg-stone-100 px-2 py-1.5 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-100 dark:hover:bg-stone-700 sm:min-h-0 sm:min-w-0 sm:px-3"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Korisnički meni"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white">
          {userName.charAt(0).toUpperCase()}
        </span>
        <span className="hidden sm:inline">{userName}</span>
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Korisnički meni"
          className="absolute right-0 mt-2 w-44 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card)] py-1 text-sm shadow-lg"
        >
          <HeaderMenuItem href="/profile" onNavigate={closeMenu}>Profil</HeaderMenuItem>
          <HeaderMenuItem href="/bookmarks" onNavigate={closeMenu}>Označeni</HeaderMenuItem>
          <HeaderMenuItem href="/progress" onNavigate={closeMenu}>Napredak</HeaderMenuItem>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center justify-between px-3 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
            onClick={async () => {
              closeMenu();
              await signOut();
              router.replace("/");
            }}
          >
            <span>Odjava</span>
          </button>
        </div>
      )}
    </div>
  );
}

function HeaderMenuItem({
  href,
  children,
  onNavigate,
}: {
  href: string;
  children: React.ReactNode;
  onNavigate?: () => void;
}) {
  return (
    <Link
      role="menuitem"
      href={href}
      className="flex items-center justify-between px-3 py-2 text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800"
      onClick={onNavigate}
    >
      <span>{children}</span>
    </Link>
  );
}

function getUserDisplayName(user: { email?: string | null; user_metadata?: Record<string, unknown> }) {
  const fullName = (user.user_metadata as { full_name?: string })?.full_name;
  if (fullName && fullName.trim()) return fullName.trim();
  if (user.email) return user.email.split("@")[0] ?? user.email;
  return "Korisnik";
}

function BackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7L8 5z" />
    </svg>
  );
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
      />
    </svg>
  );
}

function BookmarkNavIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"
      />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
      />
    </svg>
  );
}
