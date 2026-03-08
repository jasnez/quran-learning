"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const base =
  "flex flex-col items-center justify-center gap-1 py-2 text-xs transition-colors ";
const active = "text-emerald-700 dark:text-emerald-400 font-medium";
const inactive = "text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-300";

export function MobileNav() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isSurahs = pathname?.startsWith("/surahs");

  return (
    <nav
      role="navigation"
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-50 flex items-stretch border-t border-stone-200 bg-white/95 backdrop-blur md:hidden dark:border-stone-700 dark:bg-stone-900/95"
    >
      <Link
        href="/"
        className={`flex-1 ${base} ${isHome ? active : inactive}`}
        aria-current={isHome ? "page" : undefined}
      >
        <HomeIcon className="h-5 w-5" />
        <span>Home</span>
      </Link>
      <Link
        href="/surahs"
        className={`flex-1 ${base} ${isSurahs ? active : inactive}`}
        aria-current={isSurahs ? "page" : undefined}
      >
        <BookIcon className="h-5 w-5" />
        <span>Surahs</span>
      </Link>
    </nav>
  );
}

function HomeIcon({ className }: { className?: string }) {
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
        d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
      />
    </svg>
  );
}

function BookIcon({ className }: { className?: string }) {
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
        d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
      />
    </svg>
  );
}
