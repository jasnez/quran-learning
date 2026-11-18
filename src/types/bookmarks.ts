export interface Bookmark {
  id: string;
  surahNumber: number;
  ayahNumber: number;
  surahNameLatin: string;
  arabicText: string;
  note?: string;
  createdAt: string;
  collectionId?: string;
  /** Optional Bosnian translation of the ayah. */
  translationBosnian?: string;
}

export interface BookmarkCollection {
  id: string;
  name: string;
  color?: string;
  createdAt: string;
}
