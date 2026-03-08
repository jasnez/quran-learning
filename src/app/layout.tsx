import type { Metadata } from "next";
import { Geist, Geist_Mono, Amiri } from "next/font/google";
import { AppShell, ThemeProvider } from "@/components/layout";
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

export const metadata: Metadata = {
  title: "Quran Learning",
  description: "Čitanje Kur’ana s transliteracijom",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var k='quran-learning-settings';try{var s=localStorage.getItem(k);if(s){var d=JSON.parse(s);var t=(d&&d.state&&d.state.theme)||(d&&d.theme);if(t){document.documentElement.setAttribute('data-theme',t);if(t==='dark')document.documentElement.classList.add('dark');}}}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${amiri.variable} antialiased`}
      >
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
