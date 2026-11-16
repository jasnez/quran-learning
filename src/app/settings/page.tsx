"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSettingsOpen } from "@/contexts/SettingsOpenContext";

/**
 * The settings page opens the same panel that AppShell renders for the gear icon, so the page
 * has a single dialog (QA P2-6: two dialogs, duplicate IDs). Closing it goes back to the previous
 * page, or to the home page when there is none (a new tab, the installed app), instead of
 * leaving the overlay over an empty page.
 */
export default function SettingsPage() {
  const router = useRouter();
  const { isOpen, open, close } = useSettingsOpen();
  const wasOpen = useRef(false);

  useEffect(() => {
    open();
    // Leaving the page another way (browser back) must not leave the panel open elsewhere.
    return close;
  }, [open, close]);

  useEffect(() => {
    if (isOpen) {
      wasOpen.current = true;
      return;
    }
    if (!wasOpen.current) return;
    if (window.history.length > 1) router.back();
    else router.replace("/");
  }, [isOpen, router]);

  return <h1 className="sr-only">Postavke</h1>;
}
