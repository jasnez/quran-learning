"use client";

import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import type { Ayah } from "@/types/quran";
import type { VerseTimestamp } from "@/types/wordByWord";
import { splitTajwidIntoWords } from "@/lib/quran/splitTajwidIntoWords";
import { buildAyahWordTimeline, findActiveWordIndex } from "@/lib/quran/wbwTiming";
import { TajwidTextRenderer } from "./TajwidTextRenderer";
import { WordByWordRenderer, type WordByWordRendererProps } from "./WordByWordRenderer";

function shallowEqualStyle(a?: React.CSSProperties, b?: React.CSSProperties): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  const keys = Object.keys(a) as (keyof React.CSSProperties)[];
  return keys.length === Object.keys(b).length && keys.every((k) => a[k] === b[k]);
}

/**
 * The playing card re-renders on each animation frame while audio plays (QA P1-9).
 * Skip the word list unless something it shows changed; inline `style` objects are new each time.
 */
const MemoWordByWordRenderer = memo(
  WordByWordRenderer,
  (prev: WordByWordRendererProps, next: WordByWordRendererProps) =>
    prev.words === next.words &&
    prev.activeWordIndex === next.activeWordIndex &&
    prev.showColors === next.showColors &&
    prev.onWordClick === next.onWordClick &&
    prev.className === next.className &&
    shallowEqualStyle(prev.style, next.style),
);

export type AyahWordByWordProps = {
  ayah: Ayah;
  /** Chapter-audio timestamps for this verse; undefined while loading or unavailable. */
  verse: VerseTimestamp | undefined;
  /** Playback position in the per-ayah file (ms); negative when this ayah is not the current one. */
  currentTimeMs: number;
  showColors: boolean;
  /** Seek within this ayah's audio file (ms from its start). */
  onSeekMs?: (ayahRelativeMs: number) => void;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Word-by-word view of one ayah: tajwid colors per word and the recited word highlighted.
 * Falls back to the plain tajwid text when this verse has no trustworthy word timings.
 */
export function AyahWordByWord({
  ayah,
  verse,
  currentTimeMs,
  showColors,
  onSeekMs,
  className,
  style,
}: AyahWordByWordProps) {
  const words = useMemo(
    () => splitTajwidIntoWords(ayah.tajwidSegments, ayah.id),
    [ayah.tajwidSegments, ayah.id],
  );
  const timeline = useMemo(
    () => (verse ? buildAyahWordTimeline(verse, words.length) : null),
    [verse, words.length],
  );

  // Parents pass a new callback on every render; keep the latest one without breaking memo.
  const onSeekRef = useRef(onSeekMs);
  useEffect(() => {
    onSeekRef.current = onSeekMs;
  }, [onSeekMs]);
  const hasSeek = onSeekMs != null;

  const handleWordClick = useCallback(
    (wordIndex: number) => {
      const entry = timeline?.find((t) => t.wordIndex === wordIndex);
      if (entry) onSeekRef.current?.(entry.startMs);
    },
    [timeline],
  );

  if (!timeline) {
    const segments =
      ayah.tajwidSegments.length > 0 ? ayah.tajwidSegments : [{ text: ayah.arabicText, rule: "normal" as const }];
    return (
      <>
        <TajwidTextRenderer segments={segments} showColors={showColors} className={className} style={style} />
        {verse && (
          <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
            Označavanje riječi nije dostupno za ovaj ajet.
          </p>
        )}
      </>
    );
  }

  const activeWordIndex = currentTimeMs < 0 ? -1 : findActiveWordIndex(timeline, currentTimeMs);
  return (
    <MemoWordByWordRenderer
      words={words}
      activeWordIndex={activeWordIndex}
      showColors={showColors}
      onWordClick={hasSeek ? handleWordClick : undefined}
      className={className}
      style={style}
    />
  );
}
