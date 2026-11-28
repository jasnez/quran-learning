import type { ReactNode } from "react";

type AyahTextProps = {
  /** The Arabic paragraph (TajwidTextRenderer, AyahWordByWord or plain text), with its own alignment. */
  arabic: ReactNode;
  transliteration?: string | null;
  translation?: string | null;
  /** "reading": Latin lines left aligned (everywhere); "center": the learning screen. */
  align?: "reading" | "center";
  className?: string;
};

/**
 * The text of one ayah: Arabic, transcription, translation, in that order and with the same type
 * roles on every screen. Transcription: reading face, upright, muted, 18 / 19 px. Translation:
 * reading face, 17 / 18 px, at most 42rem wide.
 */
export function AyahText({ arabic, transliteration, translation, align = "reading", className = "" }: AyahTextProps) {
  const center = align === "center";
  return (
    <div className={className}>
      {arabic}
      {transliteration ? (
        <p
          data-ayah-part="transliteration"
          className={`mt-3 font-transliteration text-[1.125rem] leading-[1.55] text-ink-muted md:text-[1.1875rem] ${
            center ? "text-center" : "text-left"
          }`}
        >
          {transliteration}
        </p>
      ) : null}
      {translation ? (
        <p
          data-ayah-part="translation"
          className={`mt-2 max-w-[42rem] font-read text-[1.0625rem] leading-[1.6] text-ink md:text-lg ${
            center ? "mx-auto text-center" : "text-left"
          }`}
        >
          {translation}
        </p>
      ) : null}
    </div>
  );
}
