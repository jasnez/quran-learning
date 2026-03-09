import Link from "next/link";

const PLATFORM_NAME = "Quran Learning";
const DESCRIPTION = "Platforma za učenje Kur'ana s transliteracijom, prijevodom i audio recitacijom.";

export function Footer() {
  return (
    <footer
      role="contentinfo"
      className="flex-shrink-0 border-t border-[var(--theme-border)] bg-[var(--theme-card)]/50 dark:bg-stone-900/40"
    >
      <div className="mx-auto max-w-7xl px-4 py-8 md:py-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between md:gap-12">
          {/* Left: platform name + description */}
          <div className="min-w-0 flex-1 md:max-w-md">
            <p className="text-base font-semibold text-stone-800 dark:text-stone-200">
              {PLATFORM_NAME}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-stone-500 dark:text-stone-400">
              {DESCRIPTION}
            </p>
          </div>

          {/* Right: navigation links */}
          <nav
            className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm"
            aria-label="Footer navigacija"
          >
            <Link
              href="/"
              className="text-stone-600 transition-colors hover:text-[var(--theme-accent)] dark:text-stone-400 dark:hover:text-emerald-400"
            >
              Početna
            </Link>
            <Link
              href="/surahs"
              className="text-stone-600 transition-colors hover:text-[var(--theme-accent)] dark:text-stone-400 dark:hover:text-emerald-400"
            >
              Sure
            </Link>
            <Link
              href="/learn/1"
              className="text-stone-600 transition-colors hover:text-[var(--theme-accent)] dark:text-stone-400 dark:hover:text-emerald-400"
            >
              Nastavi učenje
            </Link>
            <Link
              href="/about"
              className="text-stone-600 transition-colors hover:text-[var(--theme-accent)] dark:text-stone-400 dark:hover:text-emerald-400"
            >
              O platformi
            </Link>
          </nav>
        </div>

        {/* Copyright row */}
        <div className="mt-8 flex flex-col items-center gap-1 border-t border-[var(--theme-border)] pt-6 text-center text-xs text-stone-500 dark:text-stone-400 md:mt-10 md:flex-row md:justify-center md:gap-2 md:border-0 md:pt-8">
          <span>© 2026 {PLATFORM_NAME}</span>
          <span className="hidden md:inline" aria-hidden>·</span>
          <span>Sva prava zadržana.</span>
        </div>
      </div>
    </footer>
  );
}
