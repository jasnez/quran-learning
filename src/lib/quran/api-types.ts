/**
 * Minimal types for Quran.com API v4 verses response.
 * Used to map API data to app types (including transliteration from resource_id 57).
 */

export type QuranApiTranslation = {
  id: number;
  resource_id: number;
  text: string;
};

export type QuranApiVerse = {
  id: number;
  verse_number: number;
  verse_key: string;
  page_number: number;
  juz_number: number;
  text_uthmani?: string;
  translations?: QuranApiTranslation[];
};

export type QuranApiVersesResponse = {
  verses: QuranApiVerse[];
  pagination: {
    per_page: number;
    current_page: number;
    next_page: number | null;
    total_pages: number;
    total_records: number;
  };
};
