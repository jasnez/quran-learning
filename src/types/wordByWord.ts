export interface WordTimingSegment {
  wordPosition: number;
  startMs: number;
  endMs: number;
}

export interface VerseTimestamp {
  verseKey: string;
  timestampFrom: number;
  timestampTo: number;
  segments: WordTimingSegment[];
}

export interface ChapterAudioData {
  chapterId: number;
  audioUrl: string;
  timestamps: VerseTimestamp[];
}

export interface WordData {
  position: number;
  textUthmani: string;
  transliteration: string;
  translation: string;
  charTypeName: "word" | "end" | "pause";
}
