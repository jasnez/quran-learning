"use client";

import { useEffect, useLayoutEffect } from "react";
import { useSettingsStore } from "@/store/settingsStore";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSettingsStore((s) => s.theme);
  const arabicFontStyle = useSettingsStore((s) => s.arabicFontStyle);
  const tajwidLines = useSettingsStore((s) => s.showTajwidColors && s.showTajwidLines);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
  }, [theme]);

  /* The tajwid line styles (tajwidRuleLineClasses) apply under this attribute. */
  useLayoutEffect(() => {
    document.documentElement.toggleAttribute("data-tajwid-lines", tajwidLines);
  }, [tajwidLines]);

  /* useLayoutEffect so attribute is set before paint and font switch is visible immediately */
  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-arabic-font", arabicFontStyle);
  }, [arabicFontStyle]);

  return <>{children}</>;
}
