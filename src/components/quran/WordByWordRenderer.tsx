"use client";

import { memo } from "react";
import type { Word } from "@/types/quran";
import { stripWaqfSigns } from "@/lib/quran/stripWaqfSigns";

export type WordByWordRendererProps = {
  words: Word[];
  currentTimeMs: number;
  /** When set, word timeline is scaled to match actual clip duration so highlight stays in sync */
  audioDurationMs?: number;
  onSeek?: (word: Word) => void;
  showInterlinear?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

function WordSpan({
  word,
  isActive,
  onSeek,
  showInterlinear,
}: {
  word: Word;
  isActive: boolean;
  onSeek?: (word: Word) => void;
  showInterlinear?: boolean;
}) {
  const tooltip = [word.transliteration, word.translationShort].filter(Boolean).join(" — ");
  return (
    <span
      className="inline-block align-baseline"
      data-word-id={word.id}
      data-active={isActive ? "true" : "false"}
    >
      <span
        role={onSeek ? "button" : undefined}
        tabIndex={onSeek ? 0 : undefined}
        title={tooltip || undefined}
        onClick={onSeek ? () => onSeek(word) : undefined}
        onKeyDown={
          onSeek
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSeek(word);
                }
              }
            : undefined
        }
        className={`cursor-pointer rounded px-0.5 transition-colors duration-150 ${
          isActive
            ? "bg-amber-200/90 text-stone-900 dark:bg-amber-400/40 dark:text-stone-100"
            : "text-stone-800 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-700"
        }`}
        style={{ font: "inherit" }}
      >
        {stripWaqfSigns(word.textArabic)}
      </span>
      {showInterlinear && word.translationShort && (
        <span className="block text-center text-xs leading-tight text-stone-500 dark:text-stone-400" dir="ltr">
          {word.translationShort}
        </span>
      )}
    </span>
  );
}

const MemoizedWordSpan = memo(WordSpan);

export function WordByWordRenderer({
  words,
  currentTimeMs,
  audioDurationMs,
  onSeek,
  showInterlinear = false,
  className = "",
  style,
}: WordByWordRendererProps) {
  const baseClass = "font-arabic leading-[1.9] text-center";
  const wrapperClass = [baseClass, className].filter(Boolean).join(" ");

  const refDurationMs = words.length > 0 ? Math.max(...words.map((w) => w.endTimeMs)) : 0;
  const scale =
    audioDurationMs != null &&
    audioDurationMs > 0 &&
    refDurationMs > 0
      ? refDurationMs / audioDurationMs
      : 1;
  const wordTimeMs = currentTimeMs * scale;

  return (
    <p
      data-word-by-word
      className={wrapperClass}
      style={style}
      dir="rtl"
      lang="ar"
    >
      {words.map((word) => {
        const isActive =
          wordTimeMs >= word.startTimeMs && wordTimeMs < word.endTimeMs;
        return (
          <MemoizedWordSpan
            key={word.id}
            word={word}
            isActive={isActive}
            onSeek={onSeek}
            showInterlinear={showInterlinear}
          />
        );
      })}
    </p>
  );
}
