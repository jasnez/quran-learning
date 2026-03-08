import Link from "next/link";

export function Footer() {
  return (
    <footer
      role="contentinfo"
      className="border-t border-stone-200 bg-stone-50/80 dark:border-stone-700 dark:bg-stone-900/50"
    >
      <div className="mx-auto max-w-4xl px-4 py-8">
        <nav
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-stone-500 dark:text-stone-400"
          aria-label="Footer navigation"
        >
          <Link
            href="/about"
            className="transition-colors hover:text-stone-700 dark:hover:text-stone-300"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="transition-colors hover:text-stone-700 dark:hover:text-stone-300"
          >
            Contact
          </Link>
          <Link
            href="/sources"
            className="transition-colors hover:text-stone-700 dark:hover:text-stone-300"
          >
            Sources
          </Link>
          <Link
            href="/privacy"
            className="transition-colors hover:text-stone-700 dark:hover:text-stone-300"
          >
            Privacy
          </Link>
        </nav>
      </div>
    </footer>
  );
}
