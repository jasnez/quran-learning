import type { Metadata, Viewport } from "next";
import { Geist, Amiri, Noto_Naskh_Arabic, Scheherazade_New } from "next/font/google";
import localFont from "next/font/local";
import { AppShell, ThemeProvider } from "@/components/layout";
import { QueryProvider } from "@/providers/QueryProvider";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { PersistentStorageRequest } from "@/components/pwa/PersistentStorageRequest";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { THEME_INIT_SCRIPT } from "./themeInitScript";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Fallback for glyphs the selected Arabic font lacks. Not preloaded: the browser downloads
// it only when a glyph needs it (QA section 6: every page preloaded fonts it did not use).
const amiri = Amiri({
  weight: ["400", "700"],
  subsets: ["arabic", "latin"],
  variable: "--font-amiri",
  preload: false,
});

const notoNaskhArabic = Noto_Naskh_Arabic({
  weight: ["400", "500", "600", "700"],
  subsets: ["arabic", "latin"],
  variable: "--font-naskh-arabic",
});

// The "uthmanic" font setting. Replaces the KFGQPC file, which drew some Uthmani spelling
// marks (U+06DF, U+06EA, U+06EB, U+06ED) as dotted circles.
// Not preloaded: only readers who pick "uthmanic" download it, when the text first uses it.
const scheherazade = Scheherazade_New({
  weight: ["400", "700"],
  subsets: ["arabic", "latin"],
  variable: "--font-scheherazade",
  preload: false,
});

// Transcription line only (class font-transliteration). Subset of Gentium Book Plus (SIL OFL)
// built by scripts/subset-transliteration-font.py: Geist lacks the letters of the IZ BiH
// "specijal" system and no Google Fonts subset has U+0331. The OFL reserves the name
// "Gentium", so the family, the files and the CSS names (next/font names the @font-face
// family after this const) say "Transcription". Not preloaded: only pages that show a
// transcription download it.
const transcriptionFont = localFont({
  src: [
    { path: "./fonts/TranscriptionBook-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/TranscriptionBook-Italic.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-transcription",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description:
    "Kur'an na bosanskom: arapski tekst, transkripcija po pravilima Rijaseta IZ BiH, Korkutov prijevod i učač Mishary Alafasy.",
  manifest: "/manifest.webmanifest",
  // "./" resolves against each page's own path: every page is its own canonical URL,
  // without the query (?ayah=5 shows the same static page).
  alternates: { canonical: "./" },
  // Pages inherit this; Next.js fills og:title and og:description from each page's own
  // title and description.
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "bs_BA",
    url: "./",
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512, alt: SITE_NAME }],
  },
  // The image is the square app icon: "summary" shows it whole, the default large card would crop it.
  twitter: { card: "summary" },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: SITE_NAME,
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
        className={`${geistSans.variable} ${amiri.variable} ${notoNaskhArabic.variable} ${scheherazade.variable} ${transcriptionFont.variable} antialiased`}
      >
        <ServiceWorkerRegistration />
        <PersistentStorageRequest />
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
