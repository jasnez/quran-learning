"use client";

import { memo, useMemo } from "react";
import type { WordData, WordTimingSegment } from "@/types/wordByWord";
import type { TajwidRule } from "@/types/quran";
import { tajwidRuleClasses } from "@/lib/quran/tajwidStyles";

export type WordByWordChapterRendererProps = {
  verseKey: string;
  words: WordData[];
  segments: WordTimingSegment[];
  currentTimeMs: number;
  isPlaying: boolean;
  showTajwidColors?: boolean;
  onWordClick?: (wordPosition: number, startMs: number) => void;
  /** Show transliteration + translation below each word (learning mode) */
  showInterlinear?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

function WordSpan({
  word,
  isActive,
  isPast,
  onWordClick,
  segment,
  showInterlinear,
}: {
  word: WordData & { tajwidRule?: TajwidRule };
  isActive: boolean;
  isPast: boolean;
  onWordClick?: (wordPosition: number, startMs: number) => void;
  segment: WordTimingSegment | undefined;
  showInterlinear?: boolean;
}) {
  const tooltip = [word.transliteration, word.translation].filter(Boolean).join(" — ");
  const handleClick = () => {
    if (segment && onWordClick) onWordClick(word.position, segment.startMs);
  };
  return (
    <span
      data-word-position={word.position}
      data-active={isActive ? "true" : "false"}
      data-past={isPast ? "true" : "false"}
      title={tooltip || undefined}
      role={onWordClick ? "button" : undefined}
      tabIndex={onWordClick ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={
        onWordClick && segment
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onWordClick(word.position, segment.startMs);
              }
            }
          : undefined
      }
      className={`
        inline-block mx-[2px] px-1 py-0.5 rounded cursor-pointer
        transition-all duration-150 ease-out
        ${isActive ? "bg-amber-200/60 dark:bg-amber-700/40 scale-105" : ""}
        ${isPast ? "opacity-60" : ""}
        ${!isActive && !isPast ? "hover:bg-gray-100 dark:hover:bg-gray-800" : ""}
        ${word.tajwidRule ? tajwidRuleClasses[word.tajwidRule] : ""}
      `}
    >
      {word.textUthmani}
      {showInterlinear && (word.transliteration || word.translation) && (
        <span className="block text-center text-xs leading-tight text-stone-500 dark:text-stone-400" dir="ltr">
          {[word.transliteration, word.translation].filter(Boolean).join(" — ")}
        </span>
      )}
    </span>
  );
}

const MemoizedWordSpan = memo(WordSpan);

function WordByWordChapterRendererInner({
  verseKey: _verseKey,
  words,
  segments,
  currentTimeMs,
  isPlaying: _isPlaying,
  showTajwidColors: _showTajwidColors,
  onWordClick,
  showInterlinear = false,
  className = "",
  style,
}: WordByWordChapterRendererProps) {
  const activeSegment = useMemo(
    () =>
      segments.find(
        (seg) => currentTimeMs >= seg.startMs && currentTimeMs < seg.endMs
      ),
    [segments, currentTimeMs]
  );
  const activeWordPosition = activeSegment?.wordPosition ?? -1;

  return (
    <div
      data-word-by-word-chapter
      dir="rtl"
      lang="ar"
      className={`text-center leading-[2.2] font-arabic ${className}`}
      style={{ ...style, fontSize: style?.fontSize ?? "1.875rem" }}
    >
      {words.map((word) => {
        const isActive = word.position === activeWordPosition;
        const isPast = activeWordPosition > 0 && word.position < activeWordPosition;
        const segment = segments.find((s) => s.wordPosition === word.position);
        return (
          <MemoizedWordSpan
            key={word.position}
            word={word}
            isActive={isActive}
            isPast={isPast}
            onWordClick={onWordClick}
            segment={segment}
            showInterlinear={showInterlinear}
          />
        );
      })}
    </div>
  );
}

export const WordByWordChapterRenderer = memo(WordByWordChapterRendererInner);
