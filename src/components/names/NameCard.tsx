"use client";

import { useRef, useState } from "react";
import type { AllahName } from "@/types/names";
import { getNamesAudioUrl } from "@/lib/names/audio";

export function NameCard({ name: n }: { name: AllahName }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const audioUrl = n.audioUrl ?? getNamesAudioUrl(n.index);

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
    } else {
      el.play().catch(() => {});
    }
    setPlaying(!playing);
  };

  return (
    <article
      className="rounded-2xl border border-stone-200/80 bg-white/50 p-6 dark:border-stone-700/80 dark:bg-stone-900/20"
      aria-labelledby={`name-arabic-${n.index}`}
    >
      <div className="mb-2 text-xs font-medium text-stone-400 dark:text-stone-500">
        {n.index} / 99
      </div>
      <p
        id={`name-arabic-${n.index}`}
        className="font-arabic text-3xl font-medium text-[var(--theme-text)] md:text-4xl"
        dir="rtl"
      >
        {n.arabic}
      </p>
      <p className="mt-4 text-lg text-stone-500 dark:text-stone-400">
        {n.transliteration}
      </p>
      <p className="mt-2 text-base text-stone-700 dark:text-stone-300">
        {n.translationBosnian}
      </p>
      <audio
        ref={audioRef}
        src={audioUrl}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        aria-hidden
      />
      <button
        type="button"
        onClick={togglePlay}
        className="mt-4 flex items-center gap-2 rounded-full bg-[var(--theme-accent)] px-4 py-2 text-white transition-opacity hover:opacity-90"
        aria-label={playing ? "Zaustavi" : "Pusti audio"}
      >
        {playing ? (
          <>
            <PauseIcon className="h-4 w-4" />
            Pauza
          </>
        ) : (
          <>
            <PlayIcon className="h-4 w-4" />
            Pusti
          </>
        )}
      </button>
    </article>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M8 5v14l11-7L8 5z" />
    </svg>
  );
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  );
}
