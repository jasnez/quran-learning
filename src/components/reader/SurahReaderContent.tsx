"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import type { Ayah, Word } from "@/types/quran";
import type { ChapterAudioData, WordData } from "@/types/wordByWord";
import { useSettingsStore } from "@/store/settingsStore";
import { usePlayerStore } from "@/store/playerStore";
import { useProgressStore } from "@/store/progressStore";
import * as audioManager from "@/lib/audio/audioManager";
import { fetchChapterAudioData, fetchWordData } from "@/lib/audio/wordTimingService";
import { normalizeWordsToAyahRelative, normalizeWordFromApi } from "@/lib/quran/wordUtils";
import { mapDbWordsToQuranComWords } from "@/lib/quran/tajwidWordMapping";
import { getJuzForAyah } from "@/lib/data/juzUtils";
import { TajwidLegend } from "@/components/quran";
import { AyahCard } from "./AyahCard";

type SurahReaderContentProps = { ayahs: Ayah[]; initialAyahNumber?: number; surahNameLatin: string; initialAutoplay?: boolean };

export function SurahReaderContent({ ayahs, initialAyahNumber, surahNameLatin, initialAutoplay }: SurahReaderContentProps) {
  const arabicFontSize = useSettingsStore((s) => s.arabicFontSize);
  const showTransliteration = useSettingsStore((s) => s.showTransliteration);
  const showTranslation = useSettingsStore((s) => s.showTranslation);
  const showTajwidColors = useSettingsStore((s) => s.showTajwidColors);
  const currentAyahId = usePlayerStore((s) => s.currentAyahId);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const currentTimeMs = usePlayerStore((s) => s.currentTimeMs);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const duration = usePlayerStore((s) => s.duration);
  const wordByWordMode = usePlayerStore((s) => s.wordByWordMode);
  const setWordByWordMode = usePlayerStore((s) => s.setWordByWordMode);
  const setChapterAudio = usePlayerStore((s) => s.setChapterAudio);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const play = usePlayerStore((s) => s.play);
  const setCurrentTime = usePlayerStore((s) => s.setCurrentTime);
  const setPendingSeek = usePlayerStore((s) => s.setPendingSeek);

  const [words, setWords] = useState<Word[]>([]);
  const [wordLevelSync, setWordLevelSync] = useState(false);
  const [chapterAudioData, setChapterAudioData] = useState<ChapterAudioData | null>(null);
  const [wordDataMap, setWordDataMap] = useState<Map<string, WordData[]>>(new Map());
  const [chapterDataError, setChapterDataError] = useState(false);

  const prevAyahIdRef = useRef<string | null>(null);
  const progressTrackedRef = useRef(false);

  const surahNumber = ayahs.length > 0 ? parseInt(ayahs[0].id.split(":")[0], 10) : 0;

  useEffect(() => {
    if (surahNumber < 1 || surahNumber > 114) return;
    let cancelled = false;
    fetch(`/api/surahs/${surahNumber}/words`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: unknown) => {
        if (cancelled) return;
        if (!Array.isArray(data)) {
          setWords([]);
          return;
        }
        const normalized = (data as Record<string, unknown>[]).map((row) =>
          normalizeWordFromApi(row)
        );
        setWords(normalized);
      })
      .catch(() => {
        if (!cancelled) setWords([]);
      });
    return () => {
      cancelled = true;
    };
  }, [surahNumber]);

  useEffect(() => {
    if (!wordByWordMode || surahNumber < 1 || surahNumber > 114) return;
    setChapterDataError(false);
    let cancelled = false;
    Promise.all([fetchChapterAudioData(surahNumber), fetchWordData(surahNumber)])
      .then(([audioData, wMap]) => {
        if (cancelled) return;
        setChapterAudioData(audioData);
        setWordDataMap(wMap);
        setChapterAudio(audioData.audioUrl, audioData.timestamps);
      })
      .catch(() => {
        if (!cancelled) {
          setChapterDataError(true);
          setChapterAudioData(null);
          setWordDataMap(new Map());
          setChapterAudio(null, null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [wordByWordMode, surahNumber, setChapterAudio]);

  const wordsByAyahKey = useMemo(() => {
    const map = new Map<string, Word[]>();
    for (const w of words) {
      const key = w.ayahKey;
      if (!key) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(w);
    }
    for (const [key, arr] of map.entries()) {
      arr.sort((a, b) => a.wordOrder - b.wordOrder);
      map.set(key, normalizeWordsToAyahRelative(arr));
    }
    return map;
  }, [words]);

  const handleSeekWord = (word: Word, ayah: Ayah, seekSeconds: number) => {
    if (currentAyahId === ayah.id) {
      audioManager.seek(seekSeconds);
      setCurrentTime(seekSeconds);
    } else {
      setPendingSeek(seekSeconds);
      setQueue(ayahs);
      play(ayah);
    }
  };

  const handleChapterWordClick = (clickedAyah: Ayah, wordPosition: number, startMs: number) => {
    const seekSeconds = startMs / 1000;
    if (currentAyahId === clickedAyah.id) {
      audioManager.seek(seekSeconds);
      setCurrentTime(seekSeconds);
    } else {
      setQueue(ayahs);
      play(clickedAyah);
      setPendingSeek(seekSeconds);
    }
  };

  // Track surah opened and last position (lightweight: once per mount)
  useEffect(() => {
    if (ayahs.length === 0 || progressTrackedRef.current) return;
    const [surahPart] = ayahs[0].id.split(":");
    const surahNumber = parseInt(surahPart, 10) || 1;
    const ayahNumber = initialAyahNumber ?? 1;
    progressTrackedRef.current = true;
    useProgressStore.getState().addSurahVisited(surahNumber);
    useProgressStore.getState().updateLastPosition(surahNumber, ayahNumber, surahNameLatin, "reader");
  }, [ayahs, initialAyahNumber, surahNameLatin]);

  // Autoplay first ayah when navigated from "next surah" (e.g. after previous surah ended)
  useEffect(() => {
    if (!initialAutoplay || ayahs.length === 0) return;
    setQueue(ayahs);
    play(ayahs[0]);
  }, [initialAutoplay, ayahs, setQueue, play]);

  // Scroll to and briefly highlight ayah when opened from search (?ayah=N)
  useEffect(() => {
    if (initialAyahNumber == null || ayahs.length === 0) return;
    const surahId = ayahs[0].id.split(":")[0];
    const id = `${surahId}:${initialAyahNumber}`;
    const el = document.querySelector(`[data-ayah-id="${id}"]`);
    if (!el) return;
    const rafId = requestAnimationFrame(() => {
      if (typeof el.scrollIntoView === "function") {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      el.setAttribute("data-highlight-from-search", "true");
    });
    const timeoutId = setTimeout(() => {
      document.querySelector(`[data-ayah-id="${id}"]`)?.removeAttribute("data-highlight-from-search");
    }, 2000);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
    };
  }, [initialAyahNumber, ayahs]);

  // Scroll active ayah into view only when transitioning between ayahs (not on mount or manual scroll)
  useEffect(() => {
    if (!currentAyahId || !isPlaying) return;
    const prev = prevAyahIdRef.current;
    prevAyahIdRef.current = currentAyahId;
    if (prev !== null && prev !== currentAyahId) {
      const el = document.querySelector(`[data-ayah-id="${currentAyahId}"]`);
      if (el && typeof el.scrollIntoView === "function") {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [currentAyahId, isPlaying]);

  if (ayahs.length === 0) {
    return (
      <div className="py-12 text-center" data-empty-state>
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-400 dark:bg-stone-800 dark:text-stone-500" data-empty-icon aria-hidden>
          <BookIcon />
        </span>
        <p className="mt-4 text-stone-500 dark:text-stone-400">
          Podaci za ovu suru će uskoro biti dostupni.
        </p>
      </div>
    );
  }

  return (
    <>
      {showTajwidColors && (
        <div className="mb-8">
          <TajwidLegend />
        </div>
      )}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-3">
        <span className="text-sm text-stone-600 dark:text-stone-400">
          Sinhronizacija s audioom
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={!wordByWordMode}
            onClick={() => setWordByWordMode(false)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              !wordByWordMode
                ? "bg-stone-200 text-stone-800 dark:bg-stone-600 dark:text-stone-100"
                : "text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 dark:text-stone-400"
            }`}
          >
            Po ajetu
          </button>
          <button
            type="button"
            role="switch"
            aria-checked={wordByWordMode}
            onClick={() => setWordByWordMode(true)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              wordByWordMode
                ? "bg-stone-200 text-stone-800 dark:bg-stone-600 dark:text-stone-100"
                : "text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 dark:text-stone-400"
            }`}
          >
            Riječ po riječ
          </button>
        </div>
      </div>
      {wordByWordMode && chapterDataError && (
        <p className="mb-4 text-sm text-amber-600 dark:text-amber-400">
          Highlight po riječima (Quran.com) nije dostupan. Koristite „Po ajetu”.
        </p>
      )}
      <ul className="space-y-14 list-none" role="list">
        {ayahs.map((ayah, index) => {
          const prevAyah = index > 0 ? ayahs[index - 1] : null;
          const [prevSurahNum, prevAyahNum] = prevAyah ? prevAyah.id.split(":").map(Number) : [0, 0];
          const [surahNum, ayahNum] = ayah.id.split(":").map(Number);
          const prevJuz = prevAyah ? getJuzForAyah(prevSurahNum!, prevAyahNum!) : undefined;
          const currentJuz = getJuzForAyah(surahNum!, ayahNum!);
          const showJuzDivider = prevAyah != null && prevJuz != null && currentJuz != null && prevJuz !== currentJuz;
          const showPageBadge =
            ayah.page > 0 && (!prevAyah || prevAyah.page !== ayah.page);

          const verseTimestamp = chapterAudioData?.timestamps.find((t) => t.verseKey === ayah.id);
          const rawChapterWords = wordDataMap.get(ayah.id);
          const dbWordsForAyah = wordsByAyahKey.get(ayah.id);
          const chapterWords =
            rawChapterWords && dbWordsForAyah
              ? mapDbWordsToQuranComWords(dbWordsForAyah, rawChapterWords)
              : rawChapterWords;
          const useChapterRenderer =
            wordByWordMode && chapterWords && chapterWords.length > 0 && verseTimestamp?.segments?.length;
          return (
            <li key={ayah.id}>
              {showJuzDivider && (
                <div
                  className="flex items-center gap-3 py-6"
                  role="separator"
                  aria-label={`Početak džuza ${currentJuz}`}
                >
                  <span className="h-px flex-1 bg-amber-200 dark:bg-amber-800/50" />
                  <Link
                    href={`/juz/${currentJuz}`}
                    className="rounded-full border border-amber-300 bg-amber-50 px-4 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200 dark:hover:bg-amber-900/50"
                  >
                    Džuz {currentJuz}
                  </Link>
                  <span className="h-px flex-1 bg-amber-200 dark:bg-amber-800/50" />
                </div>
              )}
              <AyahCard
                ayah={ayah}
                surahAyahs={ayahs}
                surahNameLatin={surahNameLatin}
                arabicFontSize={arabicFontSize}
                showTransliteration={showTransliteration}
                showTranslation={showTranslation}
                showTajwidColors={showTajwidColors}
                words={wordsByAyahKey.get(ayah.id)}
                wordLevelSync={wordLevelSync && !wordByWordMode}
                currentTimeMs={
                  currentAyahId === ayah.id
                    ? wordByWordMode
                      ? currentTimeMs
                      : Math.round(currentTime * 1000)
                    : 0
                }
                audioDurationMs={
                  currentAyahId === ayah.id && duration > 0 && !wordByWordMode
                    ? Math.round(duration * 1000)
                    : undefined
                }
                onSeekWord={
                  wordLevelSync && !wordByWordMode
                    ? (word, seekSeconds) => handleSeekWord(word, ayah, seekSeconds)
                    : undefined
                }
                chapterWords={useChapterRenderer ? chapterWords : undefined}
                chapterSegments={useChapterRenderer ? verseTimestamp!.segments : undefined}
                onChapterWordClick={
                  useChapterRenderer ? (pos, startMs) => handleChapterWordClick(ayah, pos, startMs) : undefined
                }
                showPageBadge={showPageBadge}
              />
            </li>
          );
        })}
      </ul>
    </>
  );
}

function BookIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M8 7h8" />
      <path d="M8 11h8" />
    </svg>
  );
}
