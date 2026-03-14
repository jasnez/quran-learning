"use client";

import { useEffect } from "react";
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

  useEffect(() => {
    document.documentElement.setAttribute("data-arabic-font", arabicFontStyle);
  }, [arabicFontStyle]);

  return <>{children}</>;
}
