"use client";

import Link from "next/link";
import { useState } from "react";
import { SettingsPanel } from "@/components/settings/SettingsPanel";

const BRAND_COLOR = "text-stone-800 dark:text-stone-100";
const LINK_HOVER = "hover:text-emerald-800 dark:hover:text-emerald-200";

export function Header() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  return (
    <>
      <header
      role="banner"
      className="sticky top-0 z-50 border-b border-[var(--theme-border)] bg-[var(--theme-card)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--theme-card)]/90"
    >
      <div className="mx-auto flex h-12 max-h-[52px] max-w-4xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className={`font-semibold ${BRAND_COLOR} transition-colors ${LINK_HOVER}`}
          aria-label="Quran Learning home"
        >
          Quran Learning
        </Link>

        <nav
          className="flex items-center gap-6"
          aria-label="Main navigation"
        >
          <Link
            href="/"
            className={`text-sm text-stone-600 transition-colors dark:text-stone-400 ${LINK_HOVER}`}
          >
            Home
          </Link>
          <Link
            href="/surahs"
            className={`text-sm text-stone-600 transition-colors dark:text-stone-400 ${LINK_HOVER}`}
          >
            Surahs
          </Link>
          <button
            type="button"
            className="min-h-[44px] min-w-[44px] rounded-full p-2 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200"
            aria-label="Settings"
            aria-expanded={settingsOpen}
            onClick={() => setSettingsOpen(true)}
          >
            <SettingsIcon className="h-5 w-5" />
          </button>
        </nav>
      </div>
    </header>
      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
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
