import type { Metadata } from "next";
import { DM_Sans, Syne } from "next/font/google";
import { QueryProvider } from "@/providers/query-provider";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Shiftly",
  description: "Management opérationnel pendant le service",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      data-theme="dark"
      className={`${syne.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-bg text-text">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
