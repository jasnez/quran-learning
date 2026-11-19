"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSelectedLayoutSegment } from "next/navigation";
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
import { SITE_NAME } from "@/lib/site";
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
  // Read the route tree, not the URL: the static 404.html is served for any
  // unknown URL (e.g. /surah/115), so the URL would add a link the server HTML
  // does not have and break hydration (React #418).
  const isSurahPage = useSelectedLayoutSegment() === "surah";
  const activeAudioSrc = usePlayerStore((s) => s.activeAudioSrc);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const resume = usePlayerStore((s) => s.resume);
  const pause = usePlayerStore((s) => s.pause);
  const { isHidden, hasShadow } = useStickyHeader();
  // The header slides away while scrolling down; it stays shown while it holds focus, or the
  // focused element would be hidden under it (WCAG 2.4.11).
  const [hasFocus, setHasFocus] = React.useState(false);
  const hidden = isHidden && !hasFocus;

  return (
    <header
      role="banner"
      data-hidden={hidden ? "true" : "false"}
      onFocus={() => setHasFocus(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHasFocus(false);
      }}
      className={`fixed left-0 right-0 top-0 z-50 border-b border-[var(--theme-border)] bg-[var(--theme-card)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--theme-card)]/90 transition-transform duration-200 will-change-transform ${
        hasShadow ? "shadow-sm" : ""
      } ${hidden ? "-translate-y-full" : ""}`}
    >
      <div className="mx-auto flex h-12 max-h-[52px] max-w-7xl items-center justify-between gap-6 px-4 sm:px-5">
        {/* Brand */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {isSurahPage && (
            <Link
              href="/surahs"
              className={`${ICON_BTN} shrink-0`}
              aria-label="Nazad na sve sure"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </Link>
          )}
          <Link
            href="/"
            className={`min-w-0 truncate text-base font-semibold sm:text-[1.05rem] ${BRAND_COLOR} transition-colors ${LINK_HOVER}`}
            aria-label={`${SITE_NAME}, početna`}
          >
            {SITE_NAME}
          </Link>
        </div>

        {/* Navigation */}
        <nav
          className="flex flex-shrink-0 items-center gap-3 sm:gap-4"
          aria-label="Glavna navigacija"
        >
          {activeAudioSrc && (
            <>
              <button
                type="button"
                className={ICON_BTN}
                aria-label={isPlaying ? "Pauziraj" : "Pusti"}
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
              aria-label="Sačuvani ajeti"
            >
              <Bookmark className="h-5 w-5" aria-hidden />
            </Link>
            <button
              type="button"
              className={`${ICON_BTN} hidden sm:flex`}
              aria-label="Postavke"
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

const LEARN_LINKS = [
  { href: "/tajwid", label: "Tedžvid lekcije" },
  { href: "/names", label: "Allahova lijepa imena" },
  { href: "/harfovi", label: "Harfovi i izgovor" },
];

const DUA_LINKS = [
  { href: "/duas", label: "Sve dove" },
  ...CATEGORY_ORDER.map((cat) => ({ href: `/duas/${cat}`, label: CATEGORY_LABELS[cat] })),
];

function LearnMenu() {
  const pathname = usePathname();
  const isActive = pathname?.startsWith("/tajwid") || pathname?.startsWith("/names");
  return (
    <NavDisclosure
      label="Učenje"
      buttonLabel="Učenje: tedžvid, harfovi i Allahova imena"
      isActive={!!isActive}
      links={LEARN_LINKS}
    />
  );
}

function DuasMenu() {
  const pathname = usePathname();
  return (
    <NavDisclosure
      label="Kur'anske dove"
      buttonLabel="Kur'anske dove – kategorije"
      isActive={!!pathname?.startsWith("/duas")}
      links={DUA_LINKS}
    />
  );
}

/**
 * Site navigation, so a disclosure: a button with aria-expanded and a list of links that stay
 * in the Tab order. Not role="menu", which promises arrow-key navigation (QA section 5).
 * Escape closes it and returns focus to the button; tabbing out of it or clicking elsewhere
 * closes it.
 */
function NavDisclosure({
  label,
  buttonLabel,
  isActive,
  links,
}: {
  label: string;
  buttonLabel: string;
  isActive: boolean;
  links: { href: string; label: string }[];
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const listId = React.useId();

  React.useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (ref.current?.contains(document.activeElement)) buttonRef.current?.focus();
      setOpen(false);
    };
    document.addEventListener("click", onDocClick, true);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("click", onDocClick, true);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const onBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const next = e.relatedTarget as Node | null;
    if (next && !e.currentTarget.contains(next)) setOpen(false);
  };

  return (
    <div className="relative" ref={ref} onBlur={onBlur}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={buttonLabel}
        className={`text-sm font-medium sm:py-2 sm:px-1 ${isActive ? "text-emerald-700 dark:text-emerald-400" : "text-stone-600 dark:text-stone-400 " + LINK_HOVER}`}
      >
        {label}
      </button>
      {open && (
        <ul
          id={listId}
          aria-label={label}
          className="absolute left-0 top-full mt-1 min-w-[200px] rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card)] py-1 shadow-lg"
        >
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="flex items-center justify-between px-3 py-2 text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

