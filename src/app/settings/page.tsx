"use client";

import { useRouter } from "next/navigation";
import { SettingsPanel } from "@/components/settings/SettingsPanel";

/**
 * Stranica Postavke – prikazuje isti panel postavki (tema, font, reciter, itd.)
 * kao ikona zupčanika u headeru. Korisno kada korisnik dođe ovdje preko linka (npr. s profila).
 */
export default function SettingsPage() {
  const router = useRouter();
  return (
    <SettingsPanel
      isOpen={true}
      onClose={() => router.back()}
    />
  );
}
