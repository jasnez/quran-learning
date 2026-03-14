"use client";

import { useEffect, useLayoutEffect } from "react";
import { useSettingsStore } from "@/store/settingsStore";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSettingsStore((s) => s.theme);
  const arabicFontStyle = useSettingsStore((s) => s.arabicFontStyle);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  /* useLayoutEffect so attribute is set before paint and font switch is visible immediately */
  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-arabic-font", arabicFontStyle);
  }, [arabicFontStyle]);

  return <>{children}</>;
}
