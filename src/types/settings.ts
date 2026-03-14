export type RepeatMode = "off" | "surah" | "ayah";

export type ArabicFontStyle = "naskh" | "uthmanic";

export interface SettingsState {
  theme: "light" | "dark" | "sepia";
  arabicFontSize: number;
  /** Naskh = zaobljen stil (mushaf); uthmanic = KFGQPC Uthmanic Script HAFS */
  arabicFontStyle: ArabicFontStyle;
  showTransliteration: boolean;
  showTranslation: boolean;
  showTajwidColors: boolean;
  selectedReciterId: string | null;
  playbackSpeed: number;
  repeatMode: RepeatMode;
  autoPlayNext: boolean;
}
