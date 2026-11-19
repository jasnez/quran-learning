import type { Metadata } from "next";

// The settings page is a client component and cannot export metadata itself.
export const metadata: Metadata = {
  title: "Postavke",
};

export default function SettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
