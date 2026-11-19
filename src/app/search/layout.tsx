import type { Metadata } from "next";

// The search page is a client component and cannot export metadata itself.
export const metadata: Metadata = {
  title: "Pretraga",
};

export default function SearchLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
