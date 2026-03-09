"use client";

import { useEffect, useState } from "react";
import { usePlayerStore } from "@/store/playerStore";

const DEFAULT_THRESHOLD = 400;

type BackToTopProps = {
  scrollThreshold?: number;
};

export function BackToTop({ scrollThreshold = DEFAULT_THRESHOLD }: BackToTopProps) {
  const [visible, setVisible] = useState(false);
  const hasAudio = usePlayerStore((s) => !!s.activeAudioSrc);

  useEffect(() => {
    const check = () => setVisible(window.scrollY > scrollThreshold);
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, [scrollThreshold]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      data-testid="back-to-top"
      data-above-player={hasAudio ? "true" : "false"}
      aria-label="Povratak na vrh stranice"
      className={
        hasAudio
          ? "fixed right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-stone-700 text-white shadow-lg transition-opacity hover:bg-stone-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:bg-stone-300 dark:text-stone-900 dark:hover:bg-stone-200 max-md:bottom-[8.5rem] md:bottom-24"
          : "fixed bottom-24 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-stone-700 text-white shadow-lg transition-opacity hover:bg-stone-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:bg-stone-300 dark:text-stone-900 dark:hover:bg-stone-200 max-md:bottom-24 md:bottom-8"
      }
    >
      <span aria-hidden>
        <ChevronUpIcon className="h-6 w-6" />
      </span>
    </button>
  );
}

function ChevronUpIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M7.41 15.41 12 10.83l4.59 4.58L18 14l-6-6-6 6z" />
    </svg>
  );
}
