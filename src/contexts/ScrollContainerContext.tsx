"use client";

import { createContext, useContext, type ReactNode } from "react";

export type ScrollContainerContextValue = {
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
};

const ScrollContainerContext = createContext<ScrollContainerContextValue | null>(null);

export function ScrollContainerProvider({
  children,
  scrollContainerRef,
}: {
  children: ReactNode;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <ScrollContainerContext.Provider value={{ scrollContainerRef }}>
      {children}
    </ScrollContainerContext.Provider>
  );
}

export function useScrollContainer(): ScrollContainerContextValue | null {
  return useContext(ScrollContainerContext);
}
