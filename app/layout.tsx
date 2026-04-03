import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import "@/app/globals.css";
import { Toaster } from "@/components/ui/toaster";

const sans = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Scriban — Şablon Düzenleme Stüdyosu",
  description:
    "E-posta ve belge şablonları için profesyonel görsel düzenleyici.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${sans.variable} ${mono.variable}`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
