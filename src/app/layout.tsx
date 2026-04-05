import type { Metadata } from "next";
import { Geist, Geist_Mono, Amiri, Noto_Naskh_Arabic } from "next/font/google";
import localFont from "next/font/local";
import { AppShell, ThemeProvider } from "@/components/layout";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";
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

const uthmanicHafs = localFont({
  src: "../../node_modules/kfgqpc-uthmanic-script-hafs-regular/arabic.otf",
  variable: "--font-uthmanic-hafs",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Quran Learning",
  description: "Čitanje Kur’ana s transliteracijom",
  manifest: "/manifest.webmanifest",
  themeColor: "#16a34a",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Quran Learning",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-arabic-font="naskh" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var k='quran-learning-settings';try{var s=localStorage.getItem(k);if(s){var d=JSON.parse(s);var st=(d&&d.state)||d;var t=st&&st.theme;var f=st&&st.arabicFontStyle;if(t){document.documentElement.setAttribute('data-theme',t);if(t==='dark')document.documentElement.classList.add('dark');}if(f)document.documentElement.setAttribute('data-arabic-font',f);}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${amiri.variable} ${notoNaskhArabic.variable} ${uthmanicHafs.variable} antialiased`}
      >
        <ServiceWorkerRegistration />
        <QueryProvider>
          <ThemeProvider>
            <AuthProvider>
              <AppShell>{children}</AppShell>
            </AuthProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
