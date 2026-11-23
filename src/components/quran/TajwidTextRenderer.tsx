"use client";

import type { TajwidSegment } from "@/types/quran";
import { tajwidPieceProps } from "@/lib/quran/tajwidStyles";
import { ruleFromTarget } from "@/lib/quran/tajwidRuleTap";
import { useTajwidRuleBarStore } from "@/store/tajwidRuleBarStore";
import { stripWaqfSigns } from "@/lib/quran/stripWaqfSigns";

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
  const baseClass = "font-arabic leading-[1.9]";
  const wrapperClass = [baseClass, className].filter(Boolean).join(" ");
  const openRuleBar = useTajwidRuleBarStore((s) => s.open);

  // One listener for the whole ayah: a tap on a colored letter names its rule. The letters stay
  // plain text (no tab stops); the keyboard path to the rules is the legend.
  const onClick = (e: React.MouseEvent) => {
    const rule = ruleFromTarget(e.target);
    if (rule) openRuleBar(rule);
  };

  return (
    <p className={wrapperClass} style={style} dir="rtl" lang="ar" onClick={onClick}>
      {segments.map((seg, i) => (
        <span key={i} {...tajwidPieceProps(seg.rule, showColors)}>
          {stripWaqfSigns(seg.text)}
        </span>
      ))}
    </p>
  );
}
