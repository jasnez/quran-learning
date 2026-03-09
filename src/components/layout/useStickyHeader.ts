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
};

const DEFAULT_STATE: StickyHeaderState = {
  isAtTop: true,
  isHidden: false,
  hasShadow: false,
};

/**
 * Sticky header behaviour following modern UX patterns:
 * - At top: header fully visible, no shadow.
 * - Scroll down past threshold: header slides up (hidden) to free space.
 * - Scroll up: header slides back in, with subtle shadow for context.
 */
export function useStickyHeader(options: Options = {}): StickyHeaderState {
  const { threshold = 48 } = options;
  const [state, setState] = useState<StickyHeaderState>(DEFAULT_STATE);
  const lastScrollY = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleScroll = () => {
      const current = window.scrollY || window.pageYOffset || 0;
      const prev = lastScrollY.current;
      const goingDown = current > prev;
      const atTop = current <= threshold;

      setState((prevState) => {
        if (atTop) {
          return DEFAULT_STATE;
        }

        const next: StickyHeaderState = {
          isAtTop: false,
          hasShadow: true,
          isHidden: goingDown,
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

    // Initialize based on current scroll position
    handleScroll();

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    } as AddEventListenerOptions);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  return state;
}

