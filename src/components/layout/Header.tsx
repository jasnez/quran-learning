"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePlayerStore } from "@/store/playerStore";
import { useSettingsOpen } from "@/contexts/SettingsOpenContext";

const BRAND_COLOR = "text-stone-800 dark:text-stone-100";
const LINK_HOVER = "hover:text-emerald-800 dark:hover:text-emerald-200";

export function Header() {
  const { isOpen: settingsOpen, open: openSettings, close: closeSettings } = useSettingsOpen();
  const pathname = usePathname();
  const isSurahPage = pathname?.startsWith("/surah/");
  const activeAudioSrc = usePlayerStore((s) => s.activeAudioSrc);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const resume = usePlayerStore((s) => s.resume);
  const pause = usePlayerStore((s) => s.pause);

  return (
    <>
      <header
      role="banner"
      className="sticky top-0 z-50 border-b border-[var(--theme-border)] bg-[var(--theme-card)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--theme-card)]/90"
    >
      <div className="mx-auto flex h-12 max-h-[52px] max-w-4xl items-center justify-between gap-4 px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {isSurahPage && (
            <Link
              href="/surahs"
              className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full p-2 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200"
              aria-label="Nazad na listu sura"
            >
              <BackIcon className="h-5 w-5" />
            </Link>
          )}
          <Link
            href="/"
            className={`min-w-0 truncate font-semibold ${BRAND_COLOR} transition-colors ${LINK_HOVER}`}
            aria-label="Quran Learning home"
          >
            Quran Learning
          </Link>
        </div>

        <nav
          className="flex flex-shrink-0 items-center gap-2"
          aria-label="Main navigation"
        >
          {activeAudioSrc && (
            <button
              type="button"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200"
              aria-label={isPlaying ? "Pauza" : "Pusti"}
              onClick={() => (isPlaying ? pause() : resume())}
            >
              {isPlaying ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
            </button>
          )}
          <Link
            href="/"
            className={`hidden text-sm text-stone-600 transition-colors dark:text-stone-400 sm:block ${LINK_HOVER}`}
          >
            Home
          </Link>
          <Link
            href="/search"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200 sm:min-h-[36px] sm:min-w-[36px]"
            aria-label="Pretraga"
          >
            <SearchIcon className="h-5 w-5" />
          </Link>
          <Link
            href="/surahs"
            className={`hidden text-sm text-stone-600 transition-colors dark:text-stone-400 sm:block ${LINK_HOVER}`}
          >
            Surahs
          </Link>
          <Link
            href="/bookmarks"
            className={`hidden text-sm text-stone-600 transition-colors dark:text-stone-400 sm:block ${LINK_HOVER}`}
          >
            Bookmarks
          </Link>
          <Link
            href="/bookmarks"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200 sm:min-h-[36px] sm:min-w-[36px]"
            aria-label="Označeni ajeti"
          >
            <BookmarkNavIcon className="h-5 w-5" />
          </Link>
          <button
            type="button"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200"
            aria-label="Settings"
            aria-expanded={settingsOpen}
            onClick={() => openSettings()}
          >
            <SettingsIcon className="h-5 w-5" />
          </button>
        </nav>
      </div>
    </header>
    </>
  );
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
