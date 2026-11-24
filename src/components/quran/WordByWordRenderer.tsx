"use client";

import { memo } from "react";
import type { TajwidSegment } from "@/types/quran";
import { tajwidPieceProps } from "@/lib/quran/tajwidStyles";
import { ruleFromClick } from "@/lib/quran/tajwidRuleTap";
import { useTajwidRuleBarStore } from "@/store/tajwidRuleBarStore";

export type WordByWordRendererProps = {
  /** One array of tajwid-colored pieces per word (see splitTajwidIntoWords). */
  words: TajwidSegment[][];
  /** Index of the word being recited, or -1 for none. */
  activeWordIndex: number;
  showColors: boolean;
  onWordClick?: (wordIndex: number) => void;
  className?: string;
  style?: React.CSSProperties;
};

type WordSpanProps = {
  pieces: TajwidSegment[];
  index: number;
  isActive: boolean;
  /** Roving tabindex: only one word per ayah is in the tab order. */
  isTabStop: boolean;
  showColors: boolean;
  onWordClick?: (wordIndex: number) => void;
};

/** Arabic reads right-to-left: ArrowLeft goes to the next word, ArrowRight to the previous one. */
function focusWord(from: HTMLElement, index: number): void {
  from
    .closest("[data-word-by-word]")
    ?.querySelector<HTMLElement>(`[data-word-index="${index}"]`)
    ?.focus();
}

function WordSpan({ pieces, index, isActive, isTabStop, showColors, onWordClick }: WordSpanProps) {
  const interactive = onWordClick != null;
  return (
    <span
      data-word-index={index}
      data-active={isActive ? "true" : "false"}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? (isTabStop ? 0 : -1) : undefined}
      onClick={interactive ? () => onWordClick(index) : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onWordClick(index);
              } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                e.preventDefault();
                focusWord(e.currentTarget, index + (e.key === "ArrowLeft" ? 1 : -1));
              }
            }
          : undefined
      }
      // Neutral background + ring: no tajwid hue, so every rule color (red, green, blue) stays readable.
      className={`rounded px-0.5 transition-colors duration-150 ${
        interactive ? "cursor-pointer" : ""
      } ${
        isActive
          ? "bg-surface-sunken ring-1 ring-line-strong"
          : interactive
            ? "hover:bg-surface-sunken"
            : ""
      }`}
    >
      {pieces.map((piece, i) => (
        <span key={i} {...tajwidPieceProps(piece.rule, showColors)}>
          {piece.text}
        </span>
      ))}
    </span>
  );
}

const MemoizedWordSpan = memo(WordSpan);

/** Arabic ayah text as separate words, tajwid-colored, with the recited word highlighted. */
export function WordByWordRenderer({
  words,
  activeWordIndex,
  showColors,
  onWordClick,
  className = "",
  style,
}: WordByWordRendererProps) {
  const wrapperClass = ["font-arabic leading-[1.9]", className].filter(Boolean).join(" ");
  const openRuleBar = useTajwidRuleBarStore((s) => s.open);

  // A tap on a colored letter jumps to its word (the word's own click, which runs first) and also
  // names the rule (design D3, option A). Enter and Space on a word only jump: no click event.
  const onClick = (e: React.MouseEvent) => {
    const rule = ruleFromClick(e.target);
    if (rule) openRuleBar(rule);
  };

  return (
    <p data-word-by-word className={wrapperClass} style={style} dir="rtl" lang="ar" onClick={onClick}>
      {words.map((pieces, i) => (
        <span key={i}>
          {i > 0 && " "}
          <MemoizedWordSpan
            pieces={pieces}
            index={i}
            isActive={i === activeWordIndex}
            isTabStop={i === (activeWordIndex >= 0 ? activeWordIndex : 0)}
            showColors={showColors}
            onWordClick={onWordClick}
          />
        </span>
      ))}
    </p>
  );
}
