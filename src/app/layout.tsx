import type { Metadata, Viewport } from "next";
import { Amiri, Noto_Naskh_Arabic, Scheherazade_New } from "next/font/google";
import localFont from "next/font/local";
import { AppShell, ThemeProvider } from "@/components/layout";
import { QueryProvider } from "@/providers/QueryProvider";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { PersistentStorageRequest } from "@/components/pwa/PersistentStorageRequest";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { THEME_INIT_SCRIPT } from "./themeInitScript";
import "./globals.css";

// The Latin faces are subsets of our own (scripts/subset-fonts.py, SIL OFL): "Elif Sans" from
// Source Sans 3 for the interface, "Elif Book" from Gentium Book Plus for transcription,
// translation and page titles. Both OFL fonts reserve their names ("Source", "Gentium"), so the
// subsets, their files and the CSS names (next/font names the @font-face family after the const)
// say "Elif". Elif Sans sets most text on every page, so it is preloaded; Elif Book is not.
const elifSans = localFont({
  src: [{ path: "./fonts/ElifSans.woff2", weight: "400 700", style: "normal" }],
  variable: "--font-elif-sans",
  display: "swap",
});

const elifBook = localFont({
  src: [
    { path: "./fonts/ElifBook-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/ElifBook-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-elif-book",
  display: "swap",
  preload: false,
});

// Fallback for glyphs the selected Arabic font lacks. Not preloaded: the browser downloads
// it only when a glyph needs it (QA section 6: every page preloaded fonts it did not use).
const amiri = Amiri({
  weight: ["400", "700"],
  subsets: ["arabic", "latin"],
  variable: "--font-amiri",
  preload: false,
});

// The default Arabic face. Only regular and semibold are used (Tezhib type roles).
const notoNaskhArabic = Noto_Naskh_Arabic({
  weight: ["400", "600"],
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
    // Drawn from the mark by scripts/generate-icons.ts.
    images: [{ url: "/og.png", width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: { card: "summary_large_image" },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: SITE_NAME,
  },
};

export const viewport: Viewport = {
  // The light theme's accent (Tezhib), as in the manifest.
  themeColor: "#1F3A5F",
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
        className={`${elifSans.variable} ${elifBook.variable} ${amiri.variable} ${notoNaskhArabic.variable} ${scheherazade.variable} antialiased`}
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
