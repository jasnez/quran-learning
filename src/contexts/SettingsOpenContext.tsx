"use client";

import { createContext, useContext, useState, useCallback } from "react";

type SettingsOpenContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const SettingsOpenContext = createContext<SettingsOpenContextValue | null>(null);

export function SettingsOpenProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const open = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);
  return (
    <SettingsOpenContext.Provider value={{ isOpen, open, close }}>
      {children}
    </SettingsOpenContext.Provider>
  );
}

export function useSettingsOpen() {
  const ctx = useContext(SettingsOpenContext);
  if (!ctx) throw new Error("useSettingsOpen must be used within SettingsOpenProvider");
  return ctx;
}
