"use client";

import { useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTajwidRuleBarStore } from "@/store/tajwidRuleBarStore";
import {
  tajwidRuleClasses,
  tajwidRuleLessonSlugs,
  tajwidRuleNames,
  tajwidRuleSentences,
} from "@/lib/quran/tajwidStyles";

/*
 * Above the fixed bottom bars (the tab bar and, when audio is loaded, the player: --bars-bottom)
 * and below the toast. On phones it stops short of the right edge, leaving
 * the back-to-top button (right-4, 48px) its corner. On a surface, not ink: the rule colors keep
 * 3:1 on the surface in every theme, on ink they do not.
 */
const VISIBLE =
  "fixed inset-x-3 bottom-[calc(var(--bars-bottom)+0.5rem)] max-md:right-[4.5rem] z-infobar flex items-start gap-3 rounded-xl border border-line-strong bg-surface px-4 py-3 text-sm text-ink shadow-lg md:inset-x-auto md:left-1/2 md:w-[min(36rem,calc(100%-2rem))] md:-translate-x-1/2";

/**
 * Names the tajwid rule of a tapped colored letter, with one sentence and a link to the lesson.
 * Mounted once in AppShell. The status region is always in the DOM and only its content changes,
 * so screen readers announce it; it never takes focus.
 */
export function TajwidRuleBar() {
  const rule = useTajwidRuleBarStore((s) => s.rule);
  const close = useTajwidRuleBarStore((s) => s.close);
  const pathname = usePathname();
  const barRef = useRef<HTMLDivElement>(null);

  // The link and the close button unmount on close; focus inside the bar would fall to <body>
  // (a screen reader would jump to the page top), so it goes to the main content instead.
  const closeBar = useCallback(() => {
    const hadFocus = barRef.current?.contains(document.activeElement) ?? false;
    close();
    if (hadFocus) document.getElementById("main-content")?.focus();
  }, [close]);

  useEffect(() => {
    close();
  }, [pathname, close]);

  useEffect(() => {
    if (!rule) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeBar();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [rule, closeBar]);

  return (
    <>
      {/* Always in the DOM, only its text changes: screen readers announce the rule name and the
          sentence, without the link and the button of the visible bar. */}
      <p role="status" aria-live="polite" className="sr-only">
        {rule ? `${tajwidRuleNames[rule]}: ${tajwidRuleSentences[rule]}` : ""}
      </p>
      {rule && (
        <div ref={barRef} data-tajwid-rule-bar className={VISIBLE}>
          <span aria-hidden="true" className={`text-base leading-5 ${tajwidRuleClasses[rule]}`}>
            ●
          </span>
          <p className="min-w-0 flex-1">
            <strong>{tajwidRuleNames[rule]}</strong>: {tajwidRuleSentences[rule]}{" "}
            <Link
              href={`/tajwid/${tajwidRuleLessonSlugs[rule]}`}
              className="font-medium text-accent-text underline underline-offset-2"
            >
              Lekcija
            </Link>
          </p>
          <button
            type="button"
            onClick={closeBar}
            className="-my-1 shrink-0 rounded-lg px-2 py-1 font-medium text-ink-muted hover:text-ink"
          >
            Zatvori
          </button>
        </div>
      )}
    </>
  );
}
