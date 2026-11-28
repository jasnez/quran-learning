"use client";

import { useEffect, useState } from "react";
import { useScrollContainer } from "@/contexts/ScrollContainerContext";
import { preferredScrollBehavior } from "@/lib/scrollBehavior";

const DEFAULT_THRESHOLD = 400;

type BackToTopProps = {
  scrollThreshold?: number;
};

export function BackToTop({ scrollThreshold = DEFAULT_THRESHOLD }: BackToTopProps) {
  const [visible, setVisible] = useState(false);
  const scrollContext = useScrollContainer();

  useEffect(() => {
    const container = scrollContext?.scrollContainerRef?.current;

    const getScrollTop = (): number => {
      if (container) {
        const { scrollHeight, clientHeight } = container;
        if (scrollHeight > clientHeight) return container.scrollTop;
      }
      return window.scrollY;
    };

    const check = () => setVisible(getScrollTop() > scrollThreshold);
    check();

    const useContainer = container && container.scrollHeight > container.clientHeight;
    if (useContainer) {
      container!.addEventListener("scroll", check, { passive: true });
      return () => container!.removeEventListener("scroll", check);
    }
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, [scrollThreshold, scrollContext?.scrollContainerRef]);

  const scrollToTop = () => {
    const container = scrollContext?.scrollContainerRef?.current;
    if (container && container.scrollHeight > container.clientHeight) {
      container.scrollTo({ top: 0, behavior: preferredScrollBehavior() });
    } else {
      window.scrollTo({ top: 0, behavior: preferredScrollBehavior() });
    }
  };

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      data-testid="back-to-top"
      aria-label="Povratak na vrh stranice"
      // One gap above whatever bottom bars are in the page (tab bar, player): --bars-bottom.
      className="fixed bottom-[calc(var(--bars-bottom)+1rem)] right-4 z-float flex h-12 w-12 items-center justify-center rounded-full bg-ink text-paper shadow-lg transition-opacity hover:bg-ink/90 focus-visible:outline-2 focus-visible:outline-accent-text focus-visible:outline-offset-2"
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
