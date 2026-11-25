"use client";

import { useRef, useEffect } from "react";
import { Minus, Plus } from "lucide-react";
import { useSettingsStore, type TajwidDisplay } from "@/store/settingsStore";
import type { RepeatMode, PauseAfterAyah } from "@/types/settings";
import { SURAH_FORMS, formatCount, formatNumber, pluralForm, type PluralForms } from "@/lib/format";
import { usePlayerStore } from "@/store/playerStore";
import { ChoiceGroup, Switch } from "@/components/ui";
import { TajwidLegend } from "@/components/quran/TajwidLegend";
import { useLightDismiss } from "@/components/ui/useLightDismiss";
import { useOfflineDownload, TOTAL_SURAHS, type SurahFailure } from "@/hooks/useOfflineDownload";

const GROUP_TITLE = "mb-4 text-[1.0625rem] font-semibold text-ink";
const HINT = "mt-1.5 text-[0.8125rem] text-ink-muted";
const STEP_BUTTON =
  "flex h-9 w-9 items-center justify-center rounded-control border border-line-strong text-ink-muted transition-colors duration-press ease-standard hover:bg-surface-sunken disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text";

const FONT_STYLES = [
  { value: "naskh", label: "Moderno" },
  { value: "uthmanic", label: "Klasično" },
] as const;

/** The choice is stored as the player's wordByWordMode flag. */
const SYNC_MODES = [
  { value: "ayah", label: "Po ajetu" },
  { value: "word", label: "Riječ po riječ" },
] as const;

/** The stored value stays "sepia"; the app calls that theme Hartija. */
const THEMES = [
  { value: "light", label: "Svijetla" },
  { value: "sepia", label: "Hartija" },
  { value: "dark", label: "Tamna" },
] as const;

const TAJWID_DISPLAYS: { value: TajwidDisplay; label: string }[] = [
  { value: "off", label: "Isključeno" },
  { value: "colors", label: "Boje" },
  { value: "lines", label: "Boje i linije" },
];

const FONT_MIN = 20;
const FONT_MAX = 44;
const FONT_STEP = 4;

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5] as const;
const SPEED_CHOICES = SPEED_OPTIONS.map((speed) => ({ value: String(speed), label: `${formatNumber(speed)}×` }));

const SECOND_FORMS: PluralForms = { one: "sekunda", few: "sekunde", other: "sekundi" };
const MISSING_VERB: PluralForms = { one: "Nedostaje", few: "Nedostaju", other: "Nedostaje" };

function missingAssetsSentence(count: number): string {
  const n = formatNumber(count);
  return pluralForm(count, {
    one: `Nedostaje ${n} dio aplikacije potreban za prikaz sura.`,
    few: `Nedostaju ${n} dijela aplikacije potrebna za prikaz sura.`,
    other: `Nedostaje ${n} dijelova aplikacije potrebnih za prikaz sura.`,
  });
}

const PAUSE_OPTIONS: { value: PauseAfterAyah; label: string }[] = [
  { value: "off", label: "Odmah" },
  { value: "3s", label: formatCount(3, SECOND_FORMS) },
  { value: "5s", label: formatCount(5, SECOND_FORMS) },
  { value: "10s", label: formatCount(10, SECOND_FORMS) },
  { value: "manual", label: "Ručno" },
];

type SettingsPanelProps = { isOpen: boolean; onClose: () => void };

/**
 * A native modal <dialog> (QA section 5): showModal() makes the rest of the page inert, keeps
 * Tab inside the panel, closes on Esc and returns focus to the control that opened it. While
 * closed the dialog is display: none, so none of its controls can take focus.
 */
export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const lightDismiss = useLightDismiss();

  const theme = useSettingsStore((s) => s.theme);
  const arabicFontSize = useSettingsStore((s) => s.arabicFontSize);
  const arabicFontStyle = useSettingsStore((s) => s.arabicFontStyle);
  const showTransliteration = useSettingsStore((s) => s.showTransliteration);
  const showTranslation = useSettingsStore((s) => s.showTranslation);
  const showTajwidColors = useSettingsStore((s) => s.showTajwidColors);
  const selectedReciterId = useSettingsStore((s) => s.selectedReciterId);
  const playbackSpeed = useSettingsStore((s) => s.playbackSpeed);
  const repeatMode = useSettingsStore((s) => s.repeatMode);
  const autoPlayNext = useSettingsStore((s) => s.autoPlayNext);
  const pauseAfterAyah = useSettingsStore((s) => s.pauseAfterAyah);

  const setTheme = useSettingsStore((s) => s.setTheme);
  const setArabicFontSize = useSettingsStore((s) => s.setArabicFontSize);
  const setArabicFontStyle = useSettingsStore((s) => s.setArabicFontStyle);
  const toggleTransliteration = useSettingsStore((s) => s.toggleTransliteration);
  const toggleTranslation = useSettingsStore((s) => s.toggleTranslation);
  const showTajwidLines = useSettingsStore((s) => s.showTajwidLines);
  const setTajwidDisplay = useSettingsStore((s) => s.setTajwidDisplay);
  const tajwidDisplay: TajwidDisplay = !showTajwidColors ? "off" : showTajwidLines ? "lines" : "colors";
  const setPlaybackSpeed = useSettingsStore((s) => s.setPlaybackSpeed);
  const setRepeatMode = useSettingsStore((s) => s.setRepeatMode);
  const toggleAutoPlayNext = useSettingsStore((s) => s.toggleAutoPlayNext);
  const setPauseAfterAyah = useSettingsStore((s) => s.setPauseAfterAyah);
  const wordByWordMode = usePlayerStore((s) => s.wordByWordMode);
  const setWordByWordMode = usePlayerStore((s) => s.setWordByWordMode);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    else if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  const fontDecrease = () =>
    setArabicFontSize(Math.max(FONT_MIN, arabicFontSize - FONT_STEP));
  const fontIncrease = () =>
    setArabicFontSize(Math.min(FONT_MAX, arabicFontSize + FONT_STEP));

  const reciterLabel =
    selectedReciterId === "mishary-alafasy" ? "Mishary Alafasy" : selectedReciterId ?? "—";

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="settings-panel-title"
      // The slide-out keeps the closed panel on screen for 200ms; inert keeps its controls out
      // of reach meanwhile. React sets it before the effect calls close(), and removes it before
      // showModal().
      inert={!isOpen}
      closedby="any"
      className="settings-dialog"
      onClose={onClose}
      {...lightDismiss}
    >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-line px-4 py-3">
          <h2 id="settings-panel-title" className="text-lg font-semibold text-ink">
            Postavke
          </h2>
          <button
            type="button"
            className="min-h-[44px] min-w-[44px] rounded-lg p-3 text-ink-muted hover:bg-surface-sunken hover:text-ink"
            aria-label="Zatvori"
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          {/* Reading: everything that changes how an ayah looks, in one place (the only way in
              from a reading screen is the gear in the header). */}
          <section className="mb-8" aria-labelledby="reading-heading">
            <h3 id="reading-heading" className={GROUP_TITLE}>
              Čitanje
            </h3>
            <div className="space-y-5">
              <div>
                <span id="font-size-label" className="block text-[0.9375rem] text-ink">
                  Veličina arapskih slova
                </span>
                <div className="mt-2 flex items-center gap-2" role="group" aria-labelledby="font-size-label">
                  <button
                    type="button"
                    className={STEP_BUTTON}
                    aria-label="Manja slova"
                    disabled={arabicFontSize <= FONT_MIN}
                    onClick={fontDecrease}
                  >
                    <Minus className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                  </button>
                  <span className="min-w-[3rem] text-center tabular-nums text-ink" aria-live="polite">
                    {arabicFontSize}
                  </span>
                  <button
                    type="button"
                    className={STEP_BUTTON}
                    aria-label="Veća slova"
                    disabled={arabicFontSize >= FONT_MAX}
                    onClick={fontIncrease}
                  >
                    <Plus className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                  </button>
                </div>
              </div>
              <div>
                <ChoiceGroup
                  legend="Arapsko pismo"
                  name="arabic-font-style"
                  options={FONT_STYLES}
                  value={arabicFontStyle}
                  describedBy="font-style-hint"
                  onChange={(style) => {
                    setArabicFontStyle(style);
                    document.documentElement.setAttribute("data-arabic-font", style);
                  }}
                />
                <p id="font-style-hint" className={HINT}>
                  Klasično pismo ima tradicionalniji oblik slova; moderno je jednostavnije.
                </p>
              </div>
              <div>
                <Switch id="transliteration" label="Transkripcija" checked={showTransliteration} onChange={toggleTransliteration} />
                <Switch id="translation" label="Prijevod" checked={showTranslation} onChange={toggleTranslation} />
              </div>
              <div>
                <ChoiceGroup
                  legend="Tedžvid"
                  name="tajwid-display"
                  options={TAJWID_DISPLAYS}
                  value={tajwidDisplay}
                  describedBy="tajwid-display-hint"
                  onChange={setTajwidDisplay}
                />
                <p id="tajwid-display-hint" className={HINT}>
                  Linije razlikuju pravila i kad se boje teško razlikuju: puna, tačkice, crtice, dvostruka.
                </p>
                {/* The key to the colors, and the keyboard path to the rule lessons. A lesson link
                    leaves this page, so it closes the sheet. */}
                {showTajwidColors && (
                  <div className="mt-2">
                    <TajwidLegend onNavigate={onClose} />
                  </div>
                )}
              </div>
              <ChoiceGroup
                legend="Praćenje uz zvuk"
                name="sync-mode"
                options={SYNC_MODES}
                value={wordByWordMode ? "word" : "ayah"}
                onChange={(mode) => setWordByWordMode(mode === "word")}
              />
              <ChoiceGroup legend="Tema" name="theme" options={THEMES} value={theme} onChange={setTheme} />
            </div>
          </section>

          {/* Sound */}
          <section className="mb-8" aria-labelledby="audio-heading">
            <h3 id="audio-heading" className={GROUP_TITLE}>
              Zvuk
            </h3>
            <div className="space-y-5">
              <div>
                <span className="block text-[0.9375rem] text-ink">Učač</span>
                <p className="mt-1 text-sm text-ink-muted">{reciterLabel}</p>
              </div>
              <ChoiceGroup
                legend="Brzina"
                name="playback-speed"
                options={SPEED_CHOICES}
                value={String(playbackSpeed)}
                onChange={(speed) => setPlaybackSpeed(Number(speed))}
              />
              <ChoiceGroup legend="Ponavljanje" name="repeat-mode" options={REPEAT_OPTIONS} value={repeatMode} onChange={setRepeatMode} />
              <Switch id="autoplay" label="Pusti sljedeću suru" checked={autoPlayNext} onChange={toggleAutoPlayNext} />
              <div>
                <ChoiceGroup
                  legend="Pauza između ajeta"
                  name="pause-after-ayah"
                  options={PAUSE_OPTIONS}
                  value={pauseAfterAyah}
                  describedBy="pause-after-ayah-hint"
                  onChange={setPauseAfterAyah}
                />
                <p id="pause-after-ayah-hint" className={HINT}>
                  Koliko se čeka nakon svakog ajeta. Uz &bdquo;Ručno&ldquo; sljedeći ajet počinje tek kad
                  dodirneš &bdquo;Nastavi&ldquo;.
                </p>
              </div>
            </div>
          </section>

          {/* Offline */}
          <OfflineSection active={isOpen} />
        </div>
    </dialog>
  );
}

const REPEAT_OPTIONS: { value: RepeatMode; label: string }[] = [
  { value: "off", label: "Isključeno" },
  { value: "surah", label: "Sura" },
  { value: "ayah", label: "Ajet" },
];

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
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

const SECONDARY_BUTTON =
  "w-full rounded-lg border border-line-strong px-4 py-2 text-sm text-ink-muted transition-colors hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-accent-text";
const PRIMARY_BUTTON =
  "w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-accent-text";

function failureHints(failures: SurahFailure[]): string[] {
  const hints: string[] = [];
  if (failures.some((f) => f.reason === "network")) hints.push("Možda nema internet veze.");
  const statuses = [...new Set(failures.flatMap((f) => (f.httpStatus ? [f.httpStatus] : [])))];
  if (statuses.length > 0) hints.push(`Server trenutno ne odgovara (greška ${statuses.join(", ")}). Pokušaj kasnije.`);
  if (failures.some((f) => f.reason === "not-saved")) {
    hints.push("Preglednik ih nije sačuvao; provjeri ima li telefon slobodnog prostora.");
  }
  return hints;
}

function OfflineSection({ active }: { active: boolean }) {
  const {
    start,
    retry,
    cancel,
    status,
    error,
    progress,
    total,
    progressPercent,
    availableCount,
    failures,
    failedAssetCount,
  } = useOfflineDownload({ active });

  const availableLine = (
    <p className="text-sm text-ink-muted">
      Preuzeto: {formatNumber(availableCount)} od {formatNumber(TOTAL_SURAHS)} sura.
    </p>
  );

  return (
    <section aria-labelledby="offline-heading">
      <h3 id="offline-heading" className={GROUP_TITLE}>
        Čitanje bez interneta
      </h3>

      {status === "unsupported" ? (
        <p className="text-sm text-ink-muted">
          Ovaj preglednik ne može preuzeti sure. Otvori aplikaciju u Chromeu ili Safariju.
        </p>
      ) : (
        <p className="mb-3 text-sm text-ink-muted">
          Preuzmi tekst svih {TOTAL_SURAHS} sura (arapski, transkripciju i prijevod) i čitaj bez interneta;
          to je oko 40 MB. Snimci učača nisu uključeni: za slušanje treba internet.
        </p>
      )}

      {status === "checking" && (
        <p className="text-sm text-ink-muted" role="status">
          Provjera preuzetih sura…
        </p>
      )}

      {status === "idle" && (
        <div className="space-y-3">
          {availableCount > 0 && availableLine}
          <button type="button" onClick={start} className={PRIMARY_BUTTON}>
            Preuzmi sve sure (40 MB)
          </button>
        </div>
      )}

      {status === "downloading" && (
        <div className="space-y-3" role="status" aria-live="polite">
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink">
              Preuzimanje: {formatNumber(progress)} od {formatNumber(total)} sura
            </span>
            <span className="tabular-nums text-ink-muted">
              {progressPercent}%
            </span>
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-surface-sunken"
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-accent transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <button type="button" onClick={cancel} className={SECONDARY_BUTTON}>
            Prekini preuzimanje
          </button>
        </div>
      )}

      {status === "done" && (
        <div className="space-y-3" role="status" aria-live="polite">
          <div className="flex items-center gap-2 rounded-lg bg-accent-wash px-4 py-3 text-sm text-accent-text">
            <span aria-hidden>✓</span>
            Svih {TOTAL_SURAHS} sura je preuzeto. Čitanje radi i bez interneta.
          </div>
          <button type="button" onClick={start} className={SECONDARY_BUTTON}>
            Preuzmi ponovo
          </button>
        </div>
      )}

      {status === "error" && error === "not-controlled" && (
        <div className="space-y-3" role="alert">
          <div className="rounded-lg bg-surface-sunken px-4 py-3 text-sm text-danger-text">
            Preuzimanje još ne radi na ovoj stranici. Osvježi stranicu i pokušaj ponovo.
          </div>
          <button type="button" onClick={start} className={PRIMARY_BUTTON}>
            Pokušaj ponovo
          </button>
        </div>
      )}

      {status === "error" && error === "incomplete" && (
        <div className="space-y-3" role="alert">
          <div className="space-y-1 rounded-lg bg-surface-sunken px-4 py-3 text-sm text-danger-text">
            <p className="font-medium">Preuzimanje nije završeno.</p>
            {failures.length > 0 && (
              <p>
                {pluralForm(failures.length, MISSING_VERB)} {formatCount(failures.length, SURAH_FORMS)}: {failures.map((f) => f.surah).join(", ")}.
              </p>
            )}
            {failedAssetCount > 0 && (
              <p>{missingAssetsSentence(failedAssetCount)}</p>
            )}
            {failureHints(failures).map((hint) => (
              <p key={hint}>{hint}</p>
            ))}
          </div>
          {availableLine}
          <button type="button" onClick={retry} className={PRIMARY_BUTTON}>
            Pokušaj ponovo
          </button>
        </div>
      )}
    </section>
  );
}
