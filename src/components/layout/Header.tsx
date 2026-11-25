"use client";

import React from "react";
import Link from "next/link";
import { useParams, usePathname, useSelectedLayoutSegment } from "next/navigation";
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
import { useReaderPositionStore } from "@/store/readerPositionStore";
import { readerContext } from "./readerContext";

const BRAND_COLOR = "text-ink";
const LINK_HOVER = "hover:text-accent-text";
const ICON_BTN =
  "flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2 text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink sm:min-h-[36px] sm:min-w-[36px]";
const TEXT_LINK =
  "hidden text-sm font-medium text-ink-muted transition-colors sm:inline-flex sm:py-2 sm:px-1 " +
  LINK_HOVER;
const SEPARATOR =
  "hidden h-5 w-px shrink-0 bg-line sm:block";

export function Header() {
  const { isOpen: settingsOpen, open: openSettings } = useSettingsOpen();
  // Read the route tree, not the URL: the static 404.html is served for any
  // unknown URL (e.g. /surah/115), so the URL would add a link the server HTML
  // does not have and break hydration (React #418).
  const segment = useSelectedLayoutSegment();
  const params = useParams();
  // On a reading screen the header says where you are instead of the brand (no second bar).
  // The learning screen keeps its own header until it is rebuilt (PR 4.2).
  const context = readerContext(segment, params);
  const reader = context?.kind === "learn" ? null : context;
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
      className={`fixed left-0 right-0 top-0 z-bars border-b border-line bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/90 transition-transform duration-sheet ease-standard will-change-transform ${
        hasShadow ? "shadow-sm" : ""
      } ${hidden ? "-translate-y-full" : ""}`}
    >
      <div
        className={`mx-auto flex h-[var(--bar-header)] max-w-7xl items-center justify-between gap-2 sm:gap-6 sm:px-5 ${reader ? "px-1" : "px-4"}`}
      >
        {/* Brand, or on a reading screen: back, the surah's name and the ayah on screen */}
        <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-3">
          <Link
            href="/"
            className={`min-w-0 shrink-0 truncate text-base font-semibold sm:text-[1.05rem] ${BRAND_COLOR} transition-colors ${LINK_HOVER} ${reader ? "hidden sm:block" : ""}`}
            aria-label={`${SITE_NAME}, početna`}
          >
            {SITE_NAME}
          </Link>
          {reader && (
            <>
              <span role="separator" aria-hidden className={SEPARATOR} />
              <Link href={reader.backHref} className={`${ICON_BTN} shrink-0`} aria-label={reader.backLabel}>
                <ChevronLeft className="h-5 w-5" aria-hidden />
              </Link>
              <p data-reader-title className="min-w-0 truncate text-base font-semibold text-ink">
                {reader.title}
                {reader.titleArabic && (
                  <span className="ml-2 text-[0.9375rem] font-normal text-ink-muted" dir="rtl" lang="ar" aria-hidden>
                    {reader.titleArabic}
                  </span>
                )}
              </p>
              {reader.total !== undefined && <ReaderCount total={reader.total} />}
            </>
          )}
        </div>

        {/* Navigation */}
        <nav
          className="flex flex-shrink-0 items-center gap-3 sm:gap-4"
          aria-label="Glavna navigacija"
        >
          {activeAudioSrc && (
            <>
              {/* On a phone's reading screen the player bar right below does this. */}
              <button
                type="button"
                className={`${ICON_BTN} ${reader ? "hidden sm:flex" : ""}`}
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
            <Link href="/search" className={`${ICON_BTN} ${reader ? "hidden sm:flex" : ""}`} aria-label="Pretraga">
              <Search className="h-5 w-5" aria-hidden />
            </Link>
            <Link
              href="/bookmarks"
              className={`${ICON_BTN} hidden sm:flex`}
              aria-label="Sačuvani ajeti"
            >
              <Bookmark className="h-5 w-5" aria-hidden />
            </Link>
            {/* The one way into settings on a reading screen, on every width. */}
            <button
              type="button"
              className={`${ICON_BTN} ${reader ? "" : "hidden sm:flex"}`}
              aria-label={reader ? "Postavke čitanja" : "Postavke"}
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

/** "3/7": the ayah on screen and the surah's count; in words for screen readers. */
function ReaderCount({ total }: { total: number }) {
  const ayahNumber = useReaderPositionStore((s) => s.ayahNumber);
  return (
    <span data-reader-count className="shrink-0 px-1 text-sm tabular-nums text-ink-muted">
      <span aria-hidden="true">
        {ayahNumber}/{total}
      </span>
      <span className="sr-only">
        {ayahNumber}. ajet od {total}
      </span>
    </span>
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
        className={`text-sm font-medium sm:py-2 sm:px-1 ${isActive ? "text-accent-text" : "text-ink-muted " + LINK_HOVER}`}
      >
        {label}
      </button>
      {open && (
        <ul
          id={listId}
          aria-label={label}
          className="absolute left-0 top-full mt-1 min-w-[200px] rounded-xl border border-line bg-surface py-1 shadow-lg"
        >
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="flex items-center justify-between px-3 py-2 text-ink hover:bg-surface-sunken"
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

