import { create } from "zustand";

type ReaderPositionState = {
  /** The ayah at the top of the screen in the reader, or the ayah being learned. Not persisted. */
  ayahNumber: number;
  setAyahNumber: (ayahNumber: number) => void;
};

/**
 * Where the reader is in the open surah: read by the header's counter and the desktop ayah list,
 * written by one observer (useActiveAyahObserver). Kept out of the ayah units, so scrolling
 * re-renders two small components and no ayah.
 */
export const useReaderPositionStore = create<ReaderPositionState>((set) => ({
  ayahNumber: 1,
  setAyahNumber: (ayahNumber) => set({ ayahNumber }),
}));
