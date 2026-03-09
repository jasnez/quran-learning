"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Ayah, SurahSummary } from "@/types/quran";
import { useProgressStore } from "@/store/progressStore";
import type {
  TestType,
  TestQuestionModel,
  ListenIdentifyQuestion,
  CompleteAyahQuestion,
  TranslationMatchQuestion,
  TajwidIdentifyQuestion,
} from "@/types/testMode";
import { TestQuestion } from "./TestQuestion";
import { TestResult } from "./TestResult";
import { tajwidRuleLabels } from "@/lib/quran/tajwidStyles";

const QUESTIONS_PER_TEST = 10;

const TEST_TYPES: TestType[] = [
  "listen_identify",
  "complete_ayah",
  "translation_match",
  "tajwid_identify",
];

type TestModeProps = {
  surah: SurahSummary;
  ayahs: Ayah[];
  allSurahs: SurahSummary[];
};

export function TestMode({ surah, ayahs, allSurahs }: TestModeProps) {
  const router = useRouter();
  const [testType, setTestType] = useState<TestType>("listen_identify");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const addTestResult = useProgressStore((s) => s.addTestResult);

  const questions = useMemo(
    () => generateQuestionsForType(surah, ayahs, testType),
    [surah, ayahs, testType]
  );

  const total = questions.length;
  const question = questions[currentIndex] as TestQuestionModel | undefined;

  const handleChangeSurah = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (!value) return;
    router.push(`/test/${value}`);
  };

  const handleSelectType = (type: TestType) => {
    setTestType(type);
    setCurrentIndex(0);
    setSelectedIndex(null);
    setShowFeedback(false);
    setScore(0);
    setFinished(false);
  };

  const handleSelectOption = (index: number) => {
    if (!question || showFeedback) return;
    setSelectedIndex(index);
    setShowFeedback(true);
    if (index === question.correctIndex) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (!question) return;
    if (currentIndex + 1 >= total) {
      addTestResult({
        surahNumber: surah.surahNumber,
        surahNameLatin: surah.nameLatin,
        testType,
        score,
        total,
      });
      setFinished(true);
      return;
    }
    setCurrentIndex((i) => i + 1);
    setSelectedIndex(null);
    setShowFeedback(false);
  };

  const handleRetry = () => {
    setCurrentIndex(0);
    setSelectedIndex(null);
    setShowFeedback(false);
    setScore(0);
    setFinished(false);
  };

  const currentTypeIndex = TEST_TYPES.indexOf(testType);
  const nextTestType =
    currentTypeIndex >= 0 && currentTypeIndex < TEST_TYPES.length - 1
      ? TEST_TYPES[currentTypeIndex + 1]
      : null;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
            Test mod
          </p>
          <h1 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
            {surah.nameLatin} — {surah.nameBosnian}
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Odaberi suru i tip testa, pa uradi 10 pitanja za samoprovjeru.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <label className="text-xs font-medium text-stone-600 dark:text-stone-300">
            Surah
          </label>
          <select
            value={surah.surahNumber}
            onChange={handleChangeSurah}
            className="w-full rounded-full border border-[var(--theme-border)] bg-[var(--theme-card)] px-3 py-1.5 text-sm text-stone-800 dark:text-stone-100"
          >
            {allSurahs.map((s) => (
              <option key={s.surahNumber} value={s.surahNumber}>
                {s.surahNumber}. {s.nameLatin}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap gap-2">
          {TEST_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handleSelectType(type)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium border ${
                testType === type
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : "border-[var(--theme-border)] bg-[var(--theme-card)] text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
              }`}
            >
              {labelForType(type)}
            </button>
          ))}
        </div>
        {finished && (
          <TestResult
            score={score}
            total={total}
            surahName={surah.nameLatin}
            testType={testType}
            nextTestType={nextTestType ?? undefined}
            onRetry={handleRetry}
            onNextType={
              nextTestType
                ? () => {
                    handleSelectType(nextTestType);
                  }
                : undefined
            }
          />
        )}
        {!finished && question && (
          <TestQuestion
            question={question}
            index={currentIndex}
            total={total}
            selectedIndex={selectedIndex}
            showFeedback={showFeedback}
            onSelect={handleSelectOption}
            onNext={handleNext}
          />
        )}
      </section>
    </div>
  );
}

function labelForType(type: TestType): string {
  switch (type) {
    case "listen_identify":
      return "Preslušaj i prepoznaj";
    case "complete_ayah":
      return "Dovrši ajet";
    case "translation_match":
      return "Prevod";
    case "tajwid_identify":
      return "Tajwid pravilo";
    default:
      return "Test";
  }
}

function generateQuestionsForType(
  surah: SurahSummary,
  ayahs: Ayah[],
  type: TestType
): TestQuestionModel[] {
  const usableAyahs = ayahs.slice(0, QUESTIONS_PER_TEST);
  if (usableAyahs.length === 0) return [];

  switch (type) {
    case "listen_identify":
      return usableAyahs.map<ListenIdentifyQuestion>((ayah, idx) => {
        const shuffled = shuffleArray(ayahs).slice(0, 4);
        if (!shuffled.includes(ayah)) shuffled[0] = ayah;
        const options = shuffled.map((a) => a.arabicText);
        const correctIndex = shuffled.findIndex((a) => a.ayahNumber === ayah.ayahNumber);
        return {
          id: `listen-${ayah.ayahNumber}-${idx}`,
          type: "listen_identify",
          surahNumber: surah.surahNumber,
          surahNameLatin: surah.nameLatin,
          ayahNumber: ayah.ayahNumber,
          audioUrl: resolveAyahAudioUrl(ayah),
          options,
          correctIndex: correctIndex < 0 ? 0 : correctIndex,
          explanation: `Tačan odgovor je ajet ${ayah.ayahNumber} iz sure ${surah.nameLatin}.`,
        };
      });
    case "complete_ayah":
      return usableAyahs.map<CompleteAyahQuestion>((ayah, idx) => {
        const words = ayah.arabicText.split(" ");
        const mid = Math.max(1, Math.floor(words.length / 2));
        const prefix = words.slice(0, mid).join(" ");
        const suffix = words.slice(mid).join(" ");
        const otherSuffixes = shuffleArray(ayahs)
          .filter((a) => a.ayahNumber !== ayah.ayahNumber)
          .slice(0, 3)
          .map((a) => {
            const ws = a.arabicText.split(" ");
            const m = Math.max(1, Math.floor(ws.length / 2));
            return ws.slice(m).join(" ");
          });
        const options = shuffleArray([suffix, ...otherSuffixes]);
        const correctIndex = options.indexOf(suffix);
        return {
          id: `complete-${ayah.ayahNumber}-${idx}`,
          type: "complete_ayah",
          surahNumber: surah.surahNumber,
          surahNameLatin: surah.nameLatin,
          ayahNumber: ayah.ayahNumber,
          prefixText: prefix,
          options,
          correctIndex: correctIndex < 0 ? 0 : correctIndex,
          explanation: `Ispravan nastavak je: “${suffix}”.`,
        };
      });
    case "translation_match":
      return usableAyahs.map<TranslationMatchQuestion>((ayah, idx) => {
        const translations = shuffleArray(ayahs)
          .slice(0, 4)
          .map((a) => a.translationBosnian);
        if (!translations.includes(ayah.translationBosnian)) {
          translations[0] = ayah.translationBosnian;
        }
        const options = shuffleArray(translations);
        const correctIndex = options.indexOf(ayah.translationBosnian);
        return {
          id: `translation-${ayah.ayahNumber}-${idx}`,
          type: "translation_match",
          surahNumber: surah.surahNumber,
          surahNameLatin: surah.nameLatin,
          ayahNumber: ayah.ayahNumber,
          arabicText: ayah.arabicText,
          options,
          correctIndex: correctIndex < 0 ? 0 : correctIndex,
          explanation: `Tačan prevod je: “${ayah.translationBosnian}”.`,
        };
      });
    case "tajwid_identify":
      return usableAyahs.map<TajwidIdentifyQuestion>((ayah, idx) => {
        const nonNormal = ayah.tajwidSegments.filter((s) => s.rule !== "normal");
        const segment = nonNormal[0] ?? ayah.tajwidSegments[0] ?? {
          text: ayah.arabicText.split(" ")[0] ?? "",
          rule: "normal" as const,
        };
        const options: string[] = ["normal", "mad", "ghunnah", "ikhfa", "qalqalah"].map(
          (r) => tajwidRuleLabels[r as keyof typeof tajwidRuleLabels]
        );
        const correctLabel =
          tajwidRuleLabels[segment.rule as keyof typeof tajwidRuleLabels];
        const correctIndex = options.indexOf(correctLabel);
        return {
          id: `tajwid-${ayah.ayahNumber}-${idx}`,
          type: "tajwid_identify",
          surahNumber: surah.surahNumber,
          surahNameLatin: surah.nameLatin,
          ayahNumber: ayah.ayahNumber,
          highlightedText: segment.text,
          correctRule: segment.rule,
          options,
          correctIndex: correctIndex < 0 ? 0 : correctIndex,
          explanation: `Na označenoj riječi primjenjuje se pravilo: ${correctLabel}.`,
        };
      });
    default:
      return [];
  }
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function resolveAyahAudioUrl(ayah: Ayah): string {
  const direct = (ayah.audio?.url ?? "").trim();
  if (direct) return direct;
  // Fallback: use same pattern as main player (/audio/RECITER/SSSAAA.mp3)
  const [s, a] = ayah.id.split(":").map(Number);
  const surahNum = s && Number.isFinite(s) ? s : 1;
  const ayahNum = a && Number.isFinite(a) ? a : 1;
  const pad = (n: number) => String(n).padStart(3, "0");
  return `/audio/mishary-alafasy/${pad(surahNum)}${pad(ayahNum)}.mp3`;
}


