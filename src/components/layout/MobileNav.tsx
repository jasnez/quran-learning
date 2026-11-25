"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { useState, useRef, useEffect, useId } from "react";
import {
  Home,
  BookOpen,
  GraduationCap,
  HandHelping,
  MoreHorizontal,
  Search,
  Bookmark,
  Settings,
  BarChart3,
  Sparkles,
  Palette,
  Languages,
} from "lucide-react";
import { useSettingsOpen } from "@/contexts/SettingsOpenContext";

const tabBase =
  "flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors";
const tabActive = "text-accent-text";
const tabInactive =
  "text-ink-muted hover:text-ink";

const SURAH_SEGMENTS = new Set(["surahs", "surah", "juz"]);
const MORE_SEGMENTS = new Set(["search", "bookmarks", "progress", "names", "tajwid", "harfovi"]);

export function MobileNav() {
  // The route tree, not the URL: the static 404.html is served for unknown URLs, so the URL
  // would mark a tab the server HTML does not mark (see Header). Null on the home page.
  const segment = useSelectedLayoutSegment();
  const isHome = segment === null;
  const isSurahs = segment !== null && SURAH_SEGMENTS.has(segment);
  const isLearn = segment === "learn";
  const isDuas = segment === "duas";
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const moreListId = useId();
  const { open: openSettings } = useSettingsOpen();

  const isMoreActive = segment !== null && MORE_SEGMENTS.has(segment);

  // "Više" is a disclosure of links, not role="menu" (QA section 5): Escape closes it and
  // returns focus to the button; tabbing out or clicking elsewhere closes it.
  useEffect(() => {
    if (!moreOpen) return;
    const close = () => setMoreOpen(false);
    const onDocClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) close();
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (moreRef.current?.contains(document.activeElement)) moreButtonRef.current?.focus();
      close();
    };
    document.addEventListener("click", onDocClick, true);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("click", onDocClick, true);
      document.removeEventListener("keydown", onEsc);
    };
  }, [moreOpen]);

  return (
    <nav
      role="navigation"
      aria-label="Mobilna navigacija"
      className="fixed bottom-0 left-0 right-0 z-bars flex h-[var(--bar-nav)] items-stretch border-t border-line bg-surface/95 backdrop-blur md:hidden"
    >
      <Link
        href="/"
        className={`flex-1 ${tabBase} ${isHome ? tabActive : tabInactive}`}
        aria-current={isHome ? "page" : undefined}
      >
        <Home className="h-5 w-5" strokeWidth={isHome ? 2.25 : 1.75} aria-hidden />
        <span>Početna</span>
      </Link>
      <Link
        href="/surahs"
        className={`flex-1 ${tabBase} ${isSurahs ? tabActive : tabInactive}`}
        aria-current={isSurahs ? "page" : undefined}
      >
        <BookOpen className="h-5 w-5" strokeWidth={isSurahs ? 2.25 : 1.75} aria-hidden />
        <span>Sure</span>
      </Link>
      <Link
        href="/learn/1"
        className={`flex-1 ${tabBase} ${isLearn ? tabActive : tabInactive}`}
        aria-current={isLearn ? "page" : undefined}
      >
        <GraduationCap className="h-5 w-5" strokeWidth={isLearn ? 2.25 : 1.75} aria-hidden />
        <span>Učenje</span>
      </Link>
      <Link
        href="/duas"
        className={`flex-1 ${tabBase} ${isDuas ? tabActive : tabInactive}`}
        aria-current={isDuas ? "page" : undefined}
      >
        <HandHelping className="h-5 w-5" strokeWidth={isDuas ? 2.25 : 1.75} aria-hidden />
        <span>Dove</span>
      </Link>
      <div
        className="relative flex flex-1 flex-col"
        ref={moreRef}
        onBlur={(e) => {
          const next = e.relatedTarget as Node | null;
          if (next && !e.currentTarget.contains(next)) setMoreOpen(false);
        }}
      >
        <button
          ref={moreButtonRef}
          type="button"
          onClick={() => setMoreOpen((o) => !o)}
          aria-expanded={moreOpen}
          aria-controls={moreOpen ? moreListId : undefined}
          aria-label="Više opcija"
          aria-current={isMoreActive ? "page" : undefined}
          className={`flex-1 ${tabBase} ${moreOpen || isMoreActive ? tabActive : tabInactive}`}
        >
          <MoreHorizontal className="h-5 w-5" strokeWidth={moreOpen || isMoreActive ? 2.25 : 1.75} aria-hidden />
          <span>Više</span>
        </button>
        {moreOpen && (
          <ul
            id={moreListId}
            aria-label="Više opcija"
            className="absolute bottom-full right-1 mb-2 w-60 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-lg"
          >
            {/* First: on a reading screen the header has no search icon on a phone. */}
            <MoreLink href="/search" icon={<Search className="h-4 w-4" />} onClick={() => setMoreOpen(false)}>
              Pretraga
            </MoreLink>
            <MoreLink
              href="/bookmarks"
              icon={<Bookmark className="h-4 w-4" />}
              onClick={() => setMoreOpen(false)}
            >
              Sačuvani ajeti
            </MoreLink>
            <MoreLink
              href="/progress"
              icon={<BarChart3 className="h-4 w-4" />}
              onClick={() => setMoreOpen(false)}
            >
              Napredak
            </MoreLink>
            <li>
              <button
                type="button"
                onClick={() => {
                  // The list closes, so this button cannot get focus back when the settings
                  // dialog closes; the dialog returns it to the element focused when it opened.
                  moreButtonRef.current?.focus();
                  setMoreOpen(false);
                  openSettings();
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-ink hover:bg-surface-sunken"
              >
                <span className="text-ink-muted" aria-hidden>
                  <Settings className="h-4 w-4" />
                </span>
                <span>Postavke</span>
              </button>
            </li>
            <li className="my-1 h-px bg-line" aria-hidden />
            <MoreLink
              href="/names"
              icon={<Sparkles className="h-4 w-4" />}
              onClick={() => setMoreOpen(false)}
            >
              Allahova lijepa imena
            </MoreLink>
            <MoreLink
              href="/tajwid"
              icon={<Palette className="h-4 w-4" />}
              onClick={() => setMoreOpen(false)}
            >
              Tedžvid lekcije
            </MoreLink>
            <MoreLink
              href="/harfovi"
              icon={<Languages className="h-4 w-4" />}
              onClick={() => setMoreOpen(false)}
            >
              Harfovi i izgovor
            </MoreLink>
          </ul>
        )}
      </div>
    </nav>
  );
}

function MoreLink({
  href,
  icon,
  children,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onClick}
        className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink hover:bg-surface-sunken"
      >
        <span className="text-ink-muted" aria-hidden>
          {icon}
        </span>
        <span>{children}</span>
      </Link>
    </li>
  );
}
