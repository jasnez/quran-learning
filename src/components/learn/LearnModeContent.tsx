"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { SurahSummary, Ayah, Word } from "@/types/quran";
import type { ChapterAudioData, WordData } from "@/types/wordByWord";
import { usePlayerStore } from "@/store/playerStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useBookmarkStore } from "@/store/bookmarkStore";
import { useToastStore } from "@/store/toastStore";
import { useProgressStore } from "@/store/progressStore";
import * as audioManager from "@/lib/audio/audioManager";
import { fetchChapterAudioData, fetchWordData } from "@/lib/audio/wordTimingService";
import { TajwidTextRenderer } from "@/components/quran/TajwidTextRenderer";
import { WordByWordRenderer } from "@/components/quran/WordByWordRenderer";
import { WordByWordChapterRenderer } from "@/components/quran/WordByWordChapterRenderer";
import { TajwidLegend } from "@/components/quran";
import { normalizeWordsToAyahRelative } from "@/lib/quran/wordUtils";

type LearnModeContentProps = { surah: SurahSummary; ayahs: Ayah[] };

export function LearnModeContent({ surah, ayahs }: LearnModeContentProps) {
  const arabicFontSize = useSettingsStore((s) => s.arabicFontSize);
  const showTransliteration = useSettingsStore((s) => s.showTransliteration);
  const showTranslation = useSettingsStore((s) => s.showTranslation);
  const showTajwidColors = useSettingsStore((s) => s.showTajwidColors);
  const repeatMode = useSettingsStore((s) => s.repeatMode);
  const toggleTransliteration = useSettingsStore((s) => s.toggleTransliteration);
  const toggleTranslation = useSettingsStore((s) => s.toggleTranslation);
  const cycleRepeatMode = useSettingsStore((s) => s.cycleRepeatMode);

  const currentAyahId = usePlayerStore((s) => s.currentAyahId);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const setCurrentAyah = usePlayerStore((s) => s.setCurrentAyah);
  const play = usePlayerStore((s) => s.play);
  const pause = usePlayerStore((s) => s.pause);
  const setCurrentTime = usePlayerStore((s) => s.setCurrentTime);
  const setPendingSeek = usePlayerStore((s) => s.setPendingSeek);
  const next = usePlayerStore((s) => s.next);
  const previous = usePlayerStore((s) => s.previous);
  const wordByWordMode = usePlayerStore((s) => s.wordByWordMode);
  const setWordByWordMode = usePlayerStore((s) => s.setWordByWordMode);
  const setChapterAudio = usePlayerStore((s) => s.setChapterAudio);
  const currentTimeMsStore = usePlayerStore((s) => s.currentTimeMs);

  const [words, setWords] = useState<Word[]>([]);
  const [showWordMeaning, setShowWordMeaning] = useState(true);
  const [chapterAudioData, setChapterAudioData] = useState<ChapterAudioData | null>(null);
  const [wordDataMap, setWordDataMap] = useState<Map<string, WordData[]>>(new Map());

  const toggleBookmark = useBookmarkStore((s) => s.toggleBookmark);
  const showToast = useToastStore((s) => s.showToast);

  const currentIndex = useMemo(() => {
    const idx = ayahs.findIndex((a) => a.id === currentAyahId);
    return idx >= 0 ? idx : 0;
  }, [ayahs, currentAyahId]);

  const ayah = ayahs[currentIndex];
  const isThisAyahPlaying = currentAyahId === ayah?.id && isPlaying;
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < ayahs.length - 1;

  const surahNumber = surah.surahNumber;
  const ayahNumber = ayah?.ayahNumber ?? 1;
  const bookmarked = useBookmarkStore((s) => s.isBookmarked(surahNumber, ayahNumber));

  const handleBookmark = () => {
    if (!ayah) return;
    const wasBookmarked = bookmarked;
    toggleBookmark(surahNumber, ayahNumber, surah.nameLatin, ayah.arabicText, ayah.translationBosnian);
    showToast(wasBookmarked ? "Ajet uklonjen iz oznacenih" : "Ajet dodan u oznacene");
  };

  useEffect(() => {
    if (ayahs.length === 0) return;
    setQueue(ayahs);
    const currentInList = ayahs.some((a) => a.id === currentAyahId);
    if (!currentAyahId || !currentInList) {
      setCurrentAyah(ayahs[0]);
    }
  }, [ayahs, setQueue, setCurrentAyah, currentAyahId]);

  useEffect(() => {
    if (surah.surahNumber < 1 || surah.surahNumber > 114) return;
    let cancelled = false;
    fetch(`/api/surahs/${surah.surahNumber}/words`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Word[]) => {
        if (!cancelled) setWords(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setWords([]);
      });
    return () => {
      cancelled = true;
    };
  }, [surah.surahNumber]);

  useEffect(() => {
    if (!wordByWordMode || surah.surahNumber < 1 || surah.surahNumber > 114) return;
    let cancelled = false;
    Promise.all([fetchChapterAudioData(surah.surahNumber), fetchWordData(surah.surahNumber)])
      .then(([audioData, wMap]) => {
        if (cancelled) return;
        setChapterAudioData(audioData);
        setWordDataMap(wMap);
        setChapterAudio(audioData.audioUrl, audioData.timestamps);
      })
      .catch(() => {
        if (!cancelled) {
          setChapterAudioData(null);
          setWordDataMap(new Map());
          setChapterAudio(null, null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [wordByWordMode, surah.surahNumber, setChapterAudio]);

  useEffect(() => {
    if (surah?.surahNumber) useProgressStore.getState().addSurahVisited(surah.surahNumber);
  }, [surah?.surahNumber]);

  useEffect(() => {
    if (ayah && ayahs.length > 0) {
      useProgressStore.getState().markAyahRead(surahNumber, ayah.ayahNumber, ayahs.length);
    }
  }, [surahNumber, ayah?.ayahNumber, ayah?.id, ayahs.length]);

  if (!ayah) {
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

  const segments =
    ayah.tajwidSegments?.length > 0
      ? ayah.tajwidSegments
      : [{ text: ayah.arabicText, rule: "normal" as const }];

  const wordsForAyah = useMemo(() => {
    const list = words.filter((w) => w.ayahKey === ayah.id);
    const sorted = [...list].sort((a, b) => a.wordOrder - b.wordOrder);
    return normalizeWordsToAyahRelative(sorted);
  }, [words, ayah.id]);

  const useWordByWord = wordsForAyah.length > 0;
  const chapterWords = wordDataMap.get(ayah.id);
  const verseTimestamp = chapterAudioData?.timestamps.find((t) => t.verseKey === ayah.id);
  const useChapterWordByWord =
    wordByWordMode &&
    !!chapterWords?.length &&
    !!verseTimestamp?.segments?.length;
  const currentTimeMs =
    currentAyahId === ayah.id ? (wordByWordMode ? currentTimeMsStore : Math.round(currentTime * 1000)) : 0;
  const audioDurationMs =
    currentAyahId === ayah.id && duration > 0 ? Math.round(duration * 1000) : undefined;

  const handleSeekWord = (word: Word) => {
    const refMs =
      wordsForAyah.length > 0 ? Math.max(...wordsForAyah.map((w) => w.endTimeMs)) : 0;
    const seekSeconds =
      refMs > 0 && audioDurationMs != null && audioDurationMs > 0
        ? (word.startTimeMs / refMs) * (audioDurationMs / 1000)
        : word.startTimeMs / 1000;
    if (currentAyahId === ayah.id) {
      audioManager.seek(seekSeconds);
      setCurrentTime(seekSeconds);
    } else {
      setPendingSeek(seekSeconds);
      setQueue(ayahs);
      play(ayah);
    }
  };

  const handleChapterWordClick = (wordPosition: number, startMs: number) => {
    const seekSeconds = startMs / 1000;
    if (currentAyahId === ayah.id) {
      audioManager.seek(seekSeconds);
      setCurrentTime(seekSeconds);
    } else {
      setQueue(ayahs);
      play(ayah);
      setPendingSeek(seekSeconds);
    }
  };

  const handlePlayPause = () => {
    if (isThisAyahPlaying) pause();
    else {
      // Prime audio element on direct user gesture (mobile autoplay policies)
      const playResult = audioManager.play();
      if (playResult && typeof (playResult as Promise<void>).catch === "function") {
        void (playResult as Promise<void>).catch(() => {
          // ignore – actual source will be loaded via AudioPlayer effect
        });
      }
      setQueue(ayahs);
      play(ayah);
      useProgressStore
        .getState()
        .updateLastPosition(surahNumber, ayah.ayahNumber, surah.nameLatin, "learning");
    }
  };

  const learnFontSize = Math.max(arabicFontSize + 12, 40);

  return (
    <>
      {/* Top: surah name, ayah X of Y, close/back */}
      <header className="flex flex-shrink-0 items-center justify-between gap-4 border-b border-stone-200/80 pb-4 dark:border-stone-700/80">
        <div className="min-w-0">
          <h1
            className="font-arabic text-xl font-medium text-stone-800 dark:text-stone-200 truncate"
            dir="rtl"
            lang="ar"
          >
            {surah.nameArabic}
          </h1>
          <p className="mt-0.5 text-sm text-stone-500 dark:text-stone-400">
            {surah.nameLatin}
            {surah.nameBosnian && (
              <>
                <span className="mx-1.5 text-stone-400">·</span>
                {surah.nameBosnian}
              </>
            )}
          </p>
        </div>
        <p className="flex-shrink-0 text-sm font-medium text-stone-500 dark:text-stone-400" aria-live="polite">
          Ajet {currentIndex + 1} od {ayahs.length}
        </p>
        <Link
          href={`/surah/${surah.surahNumber}`}
          className="flex-shrink-0 rounded-lg p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-700 dark:hover:text-stone-300"
          aria-label="Zatvori režim učenja"
        >
          <CloseIcon />
        </Link>
      </header>

      {/* Center: Arabic (very large), transliteration, translation */}
      <section className="flex flex-1 flex-col justify-center py-8" aria-label="Trenutni ajet">
        <article className="rounded-2xl border border-stone-200/80 bg-white/50 px-6 py-10 dark:border-stone-700/80 dark:bg-stone-900/20">
          {useChapterWordByWord ? (
            <WordByWordChapterRenderer
              verseKey={ayah.id}
              words={chapterWords!}
              segments={verseTimestamp!.segments}
              currentTimeMs={currentTimeMs}
              isPlaying={isThisAyahPlaying}
              showTajwidColors={showTajwidColors}
              onWordClick={handleChapterWordClick}
              showInterlinear={showWordMeaning}
              className="text-center"
              style={{ fontSize: `${learnFontSize}px` }}
            />
          ) : useWordByWord ? (
            <WordByWordRenderer
              words={wordsForAyah}
              currentTimeMs={currentTimeMs}
              audioDurationMs={audioDurationMs}
              onSeek={handleSeekWord}
              showInterlinear
              className="text-center"
              style={{ fontSize: `${learnFontSize}px` }}
            />
          ) : (
            <TajwidTextRenderer
              segments={segments}
              showColors={showTajwidColors}
              style={{ fontSize: `${learnFontSize}px` }}
            />
          )}
          {showTransliteration && ayah.transliteration && (
            <p className="mt-8 text-center text-lg leading-relaxed text-stone-500 dark:text-stone-400">
              {ayah.transliteration}
            </p>
          )}
          {showTranslation && ayah.translationBosnian && (
            <p className="mt-6 text-center text-base leading-relaxed text-stone-700 dark:text-stone-300">
              {ayah.translationBosnian}
            </p>
          )}
        </article>
      </section>

      {/* Bottom controls */}
      <footer className="flex flex-shrink-0 flex-col gap-4 border-t border-stone-200/80 pt-6 dark:border-stone-700/80">
        {showTajwidColors && (
          <div className="rounded-xl border border-stone-200/80 bg-stone-50/60 dark:border-stone-700/80 dark:bg-stone-900/40">
            <TajwidLegend />
          </div>
        )}
        {!canGoNext && ayahs.length > 0 && (
          <p className="text-center text-sm text-stone-500 dark:text-stone-400" role="status">
            Završili ste ovu suru.
          </p>
        )}
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            className="rounded-xl p-3 text-stone-500 hover:bg-stone-100 hover:text-stone-700 disabled:opacity-40 disabled:hover:bg-transparent dark:hover:bg-stone-700 dark:hover:text-stone-300"
            aria-label="Prethodni ajet"
            disabled={!canGoPrev}
            onClick={previous}
          >
            <PrevIcon />
          </button>
          <button
            type="button"
            onClick={handleBookmark}
            className={`rounded-xl p-3 transition-all duration-200 ease-out hover:scale-105 active:scale-95 ${
              bookmarked
                ? "text-amber-500 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/30 dark:hover:text-amber-400"
                : "text-stone-500 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-700 dark:hover:text-stone-300"
            }`}
            aria-label={bookmarked ? "Ukloni iz označenih" : "Dodaj u označene"}
            title={bookmarked ? "Ukloni iz označenih" : "Dodaj u označene"}
          >
            <BookmarkIcon filled={bookmarked} />
          </button>
          <button
            type="button"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 dark:bg-emerald-500 dark:hover:bg-emerald-400"
            aria-label={isThisAyahPlaying ? "Pauza" : "Pusti audio"}
            onClick={handlePlayPause}
          >
            {isThisAyahPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button
            type="button"
            className="rounded-xl p-3 text-stone-500 hover:bg-stone-100 hover:text-stone-700 disabled:opacity-40 disabled:hover:bg-transparent dark:hover:bg-stone-700 dark:hover:text-stone-300"
            aria-label="Sljedeći ajet"
            disabled={!canGoNext}
            onClick={next}
          >
            <NextIcon />
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            className="rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-700"
            aria-label={wordByWordMode ? "Isključi riječ po riječ" : "Uključi riječ po riječ"}
            aria-pressed={wordByWordMode}
            onClick={() => setWordByWordMode(!wordByWordMode)}
          >
            Riječ po riječ
          </button>
          {wordByWordMode && (
            <button
              type="button"
              className="rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-700"
              aria-label={showWordMeaning ? "Sakrij značenje riječi" : "Prikaži značenje riječi"}
              aria-pressed={showWordMeaning}
              onClick={() => setShowWordMeaning(!showWordMeaning)}
            >
              Prikaži značenje riječi
            </button>
          )}
          <button
            type="button"
            className="rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-700"
            aria-label={
              repeatMode === "off"
                ? "Ponavljaj (prvi klik: sura, drugi klik: ajet)"
                : repeatMode === "surah"
                  ? "Ponavljanje sure. Klik za ponavljanje ajeta."
                  : "Ponavljanje ajeta. Klik za isključivanje."
            }
            aria-pressed={repeatMode !== "off"}
            onClick={cycleRepeatMode}
          >
            Ponavljaj{repeatMode !== "off" ? ` (${repeatMode === "surah" ? "sura" : "ajet"})` : ""}
          </button>
          <button
            type="button"
            className="rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-700"
            aria-label={showTransliteration ? "Sakrij transliteraciju" : "Prikaži transliteraciju"}
            aria-pressed={showTransliteration}
            onClick={toggleTransliteration}
          >
            Transliteracija
          </button>
          <button
            type="button"
            className="rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-700"
            aria-label={showTranslation ? "Sakrij prijevod" : "Prikaži prijevod"}
            aria-pressed={showTranslation}
            onClick={toggleTranslation}
          >
            Prijevod
          </button>
        </div>
      </footer>
    </>
  );
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
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

function BookmarkIcon({ filled }: { filled?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="transition-transform duration-200"
      aria-hidden
    >
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
    </svg>
  );
}

function PrevIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function NextIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}
