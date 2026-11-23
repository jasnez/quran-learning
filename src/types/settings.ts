export type RepeatMode = "off" | "surah" | "ayah";

export type PauseAfterAyah = "off" | "3s" | "5s" | "10s" | "manual";

export type ArabicFontStyle = "naskh" | "uthmanic";

export interface SettingsState {
  theme: "light" | "dark" | "sepia";
  arabicFontSize: number;
  /** Naskh = zaobljen stil (mushaf); uthmanic = KFGQPC Uthmanic Script HAFS */
  arabicFontStyle: ArabicFontStyle;
  showTransliteration: boolean;
  showTranslation: boolean;
  showTajwidColors: boolean;
  /** False until the one-time notice about the mushaf tajwid colors (Phase 3) has been shown. */
  tajwidNoticeSeen: boolean;
  selectedReciterId: string | null;
  playbackSpeed: number;
  repeatMode: RepeatMode;
  autoPlayNext: boolean;
  pauseAfterAyah: PauseAfterAyah;
}
