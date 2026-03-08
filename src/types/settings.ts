export interface SettingsState {
  theme: "light" | "dark" | "sepia";
  arabicFontSize: number;
  showTransliteration: boolean;
  showTranslation: boolean;
  showTajwidColors: boolean;
  selectedReciterId: string | null;
  playbackSpeed: number;
  repeatAyah: boolean;
  autoPlayNext: boolean;
}
