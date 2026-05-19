"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {
  Home,
  BookOpen,
  GraduationCap,
  HandHelping,
  MoreHorizontal,
  Bookmark,
  Settings,
  BarChart3,
  Sparkles,
  Palette,
  ListChecks,
} from "lucide-react";
import { useSettingsOpen } from "@/contexts/SettingsOpenContext";

const tabBase =
  "flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors";
const tabActive = "text-emerald-700 dark:text-emerald-400";
const tabInactive =
  "text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200";

export function MobileNav() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isSurahs = pathname?.startsWith("/surahs");
  const isLearn = pathname?.startsWith("/learn");
  const isDuas = pathname?.startsWith("/duas");
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const { open: openSettings } = useSettingsOpen();

  const isMoreActive =
    pathname?.startsWith("/bookmarks") ||
    pathname?.startsWith("/progress") ||
    pathname?.startsWith("/names") ||
    pathname?.startsWith("/tajwid") ||
    pathname?.startsWith("/test");

  useEffect(() => {
    if (!moreOpen) return;
    const close = () => setMoreOpen(false);
    const onDocClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) close();
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
  }, [moreOpen]);

  return (
    <nav
      role="navigation"
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-50 flex min-h-14 items-stretch border-t border-stone-200 bg-white/95 backdrop-blur md:hidden dark:border-stone-700 dark:bg-stone-900/95"
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
      <div className="relative flex flex-1 flex-col" ref={moreRef}>
        <button
          type="button"
          onClick={() => setMoreOpen((o) => !o)}
          aria-expanded={moreOpen}
          aria-haspopup="true"
          aria-label="Više opcija"
          aria-current={isMoreActive ? "page" : undefined}
          className={`flex-1 ${tabBase} ${moreOpen || isMoreActive ? tabActive : tabInactive}`}
        >
          <MoreHorizontal className="h-5 w-5" strokeWidth={moreOpen || isMoreActive ? 2.25 : 1.75} aria-hidden />
          <span>Više</span>
        </button>
        {moreOpen && (
          <div
            role="menu"
            aria-label="Više opcija"
            className="absolute bottom-full right-1 mb-2 w-60 overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-lg dark:border-stone-700 dark:bg-stone-800"
          >
            <MoreLink
              href="/bookmarks"
              icon={<Bookmark className="h-4 w-4" />}
              onClick={() => setMoreOpen(false)}
            >
              Označeni ajeti
            </MoreLink>
            <MoreLink
              href="/progress"
              icon={<BarChart3 className="h-4 w-4" />}
              onClick={() => setMoreOpen(false)}
            >
              Napredak
            </MoreLink>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMoreOpen(false);
                openSettings();
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-700"
            >
              <span className="text-stone-500 dark:text-stone-400" aria-hidden>
                <Settings className="h-4 w-4" />
              </span>
              <span>Postavke</span>
            </button>
            <div className="my-1 h-px bg-stone-200 dark:bg-stone-700" aria-hidden />
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
              href="/test/1"
              icon={<ListChecks className="h-4 w-4" />}
              onClick={() => setMoreOpen(false)}
            >
              Kviz
            </MoreLink>
          </div>
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
    <Link
      role="menuitem"
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-700"
    >
      <span className="text-stone-500 dark:text-stone-400" aria-hidden>
        {icon}
      </span>
      <span>{children}</span>
    </Link>
  );
}
