"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  Play,
  Pause,
  Search,
  Bookmark,
  Settings as SettingsIcon,
} from "lucide-react";
import { usePlayerStore } from "@/store/playerStore";
import { useSettingsOpen } from "@/contexts/SettingsOpenContext";
import { useStickyHeader } from "./useStickyHeader";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/duas/categories";

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
              <ChevronLeft className="h-5 w-5" aria-hidden />
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
                  <Pause className="h-5 w-5 fill-current" aria-hidden />
                ) : (
                  <Play className="h-5 w-5 fill-current" aria-hidden />
                )}
              </button>
              <span role="separator" aria-hidden className={SEPARATOR} />
            </>
          )}

          <div className="hidden items-center gap-5 sm:flex">
            <Link href="/surahs" className={TEXT_LINK}>
              Sure
            </Link>
            <LearnMenu />
            <DuasMenu />
            <Link href="/progress" className={TEXT_LINK}>
              Napredak
            </Link>
          </div>

          <span role="separator" aria-hidden className={SEPARATOR} />

          <div className="flex items-center gap-1 sm:gap-2">
            <Link href="/search" className={ICON_BTN} aria-label="Pretraga">
              <Search className="h-5 w-5" aria-hidden />
            </Link>
            <Link
              href="/bookmarks"
              className={`${ICON_BTN} hidden sm:flex`}
              aria-label="Označeni ajeti"
            >
              <Bookmark className="h-5 w-5" aria-hidden />
            </Link>
            <button
              type="button"
              className={`${ICON_BTN} hidden sm:flex`}
              aria-label="Settings"
              aria-expanded={settingsOpen}
              onClick={() => openSettings()}
            >
              <SettingsIcon className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}

function LearnMenu() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const isActive =
    pathname?.startsWith("/test") ||
    pathname?.startsWith("/tajwid") ||
    pathname?.startsWith("/names");

  React.useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("click", onDocClick, true);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("click", onDocClick, true);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Učenje – Kviz, Tedžvid, Allahova lijepa imena"
        className={`text-sm font-medium sm:py-2 sm:px-1 ${isActive ? "text-emerald-700 dark:text-emerald-400" : "text-stone-600 dark:text-stone-400 " + LINK_HOVER}`}
      >
        Učenje
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Učenje"
          className="absolute left-0 top-full mt-1 min-w-[200px] rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card)] py-1 shadow-lg"
        >
          <HeaderMenuItem href="/test/1" onNavigate={() => setOpen(false)}>
            Kviz
          </HeaderMenuItem>
          <HeaderMenuItem href="/tajwid" onNavigate={() => setOpen(false)}>
            Tedžvid lekcije
          </HeaderMenuItem>
          <HeaderMenuItem href="/names" onNavigate={() => setOpen(false)}>
            Allahova lijepa imena
          </HeaderMenuItem>
        </div>
      )}
    </div>
  );
}

function DuasMenu() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const isActive = pathname?.startsWith("/duas");

  React.useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("click", onDocClick, true);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("click", onDocClick, true);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Kur'anske dove – kategorije"
        className={`text-sm font-medium sm:py-2 sm:px-1 ${isActive ? "text-emerald-700 dark:text-emerald-400" : "text-stone-600 dark:text-stone-400 " + LINK_HOVER}`}
      >
        Kur&apos;anske dove
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Kur'anske dove"
          className="absolute left-0 top-full mt-1 min-w-[200px] rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card)] py-1 shadow-lg"
        >
          <HeaderMenuItem href="/duas" onNavigate={() => setOpen(false)}>
            Sve dove
          </HeaderMenuItem>
          {CATEGORY_ORDER.map((cat) => (
            <HeaderMenuItem
              key={cat}
              href={`/duas/${cat}`}
              onNavigate={() => setOpen(false)}
            >
              {CATEGORY_LABELS[cat]}
            </HeaderMenuItem>
          ))}
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

