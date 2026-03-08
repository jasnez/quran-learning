export type RepeatMode = "off" | "surah" | "ayah";

export interface SettingsState {
  theme: "light" | "dark" | "sepia";
  arabicFontSize: number;
  showTransliteration: boolean;
  showTranslation: boolean;
  showTajwidColors: boolean;
  selectedReciterId: string | null;
  playbackSpeed: number;
  repeatMode: RepeatMode;
  autoPlayNext: boolean;
}
