"use client";

import { useEffect, useRef, useState } from "react";

export type StickyHeaderState = {
  /** True when near the very top of the page. */
  isAtTop: boolean;
  /** True when header should slide out of view while scrolling down. */
  isHidden: boolean;
  /** True when page is scrolled and header should show elevation/shadow. */
  hasShadow: boolean;
};

type Options = {
  /** Scroll offset (px) after which header can hide and gain shadow. */
  threshold?: number;
  /** Min scroll delta (px) to treat as intentional direction change; avoids jitter. */
  deltaThreshold?: number;
};

const DEFAULT_STATE: StickyHeaderState = {
  isAtTop: true,
  isHidden: false,
  hasShadow: false,
};

function getScrollTop(): number {
  if (typeof window === "undefined") return 0;
  return (
    window.scrollY ??
    window.pageYOffset ??
    (document.scrollingElement?.scrollTop ?? 0) ??
    document.documentElement?.scrollTop ??
    0
  );
}

/**
 * Sticky header behaviour following modern UX patterns:
 * - At top: header fully visible, no shadow.
 * - Scroll down past threshold: header slides up (hidden) to free space.
 * - Scroll up: header slides back in, with subtle shadow for context.
 */
export function useStickyHeader(options: Options = {}): StickyHeaderState {
  const { threshold = 48, deltaThreshold = 10 } = options;
  const [state, setState] = useState<StickyHeaderState>(DEFAULT_STATE);
  const lastScrollY = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleScroll = () => {
      const current = getScrollTop();
      const prev = lastScrollY.current;
      const delta = current - prev;
      const atTop = current <= threshold;

      setState((prevState) => {
        if (atTop) {
          return DEFAULT_STATE;
        }

        const goingDown = delta > deltaThreshold;
        const goingUp = delta < -deltaThreshold;
        const nextHidden = goingUp
          ? false
          : goingDown
            ? true
            : prevState.isHidden;

        const next: StickyHeaderState = {
          isAtTop: false,
          hasShadow: true,
          isHidden: nextHidden,
        };

        if (
          next.isAtTop === prevState.isAtTop &&
          next.hasShadow === prevState.hasShadow &&
          next.isHidden === prevState.isHidden
        ) {
          return prevState;
        }
        return next;
      });

      lastScrollY.current = current;
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    } as AddEventListenerOptions);
    document.addEventListener("scroll", handleScroll, {
      passive: true,
    } as AddEventListenerOptions);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("scroll", handleScroll);
    };
  }, [threshold, deltaThreshold]);

  return state;
}

