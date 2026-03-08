import type { TajwidSegment } from "@/types/quran";
import { tajwidRuleClasses } from "@/lib/quran/tajwidStyles";

type TajwidTextRendererProps = {
  segments: TajwidSegment[];
  showColors: boolean;
  /** Optional className for the wrapper (e.g. font-arabic). */
  className?: string;
  /** Optional style for the wrapper (e.g. fontSize). */
  style?: React.CSSProperties;
};

export function TajwidTextRenderer({
  segments,
  showColors,
  className = "",
  style,
}: TajwidTextRendererProps) {
  const baseClass = "font-arabic leading-[1.9] text-center";
  const wrapperClass = [baseClass, className].filter(Boolean).join(" ");

  return (
    <p className={wrapperClass} style={style} dir="rtl" lang="ar">
      {segments.map((seg, i) => {
        const colorClass = showColors
          ? tajwidRuleClasses[seg.rule]
          : tajwidRuleClasses.normal;
        return (
          <span key={i} className={colorClass}>
            {seg.text}
          </span>
        );
      })}
    </p>
  );
}
