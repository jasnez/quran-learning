import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Amiri, Noto_Naskh_Arabic, Scheherazade_New } from "next/font/google";
import { AppShell, ThemeProvider } from "@/components/layout";
import { QueryProvider } from "@/providers/QueryProvider";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { THEME_INIT_SCRIPT } from "./themeInitScript";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const amiri = Amiri({
  weight: ["400", "700"],
  subsets: ["arabic", "latin"],
  variable: "--font-amiri",
});

const notoNaskhArabic = Noto_Naskh_Arabic({
  weight: ["400", "500", "600", "700"],
  subsets: ["arabic", "latin"],
  variable: "--font-naskh-arabic",
});

// The "uthmanic" font setting. Replaces the KFGQPC file, which drew some Uthmani spelling
// marks (U+06DF, U+06EA, U+06EB, U+06ED) as dotted circles.
const scheherazade = Scheherazade_New({
  weight: ["400", "700"],
  subsets: ["arabic", "latin"],
  variable: "--font-scheherazade",
});

export const metadata: Metadata = {
  title: "Quran Learning",
  description: "Čitanje Kur’ana s transliteracijom",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Quran Learning",
  },
};

export const viewport: Viewport = {
  themeColor: "#047857",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bs" data-arabic-font="naskh" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: THEME_INIT_SCRIPT,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${amiri.variable} ${notoNaskhArabic.variable} ${scheherazade.variable} antialiased`}
      >
        <ServiceWorkerRegistration />
        <QueryProvider>
          <ThemeProvider>
            <AppShell>{children}</AppShell>
            <InstallPrompt />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
