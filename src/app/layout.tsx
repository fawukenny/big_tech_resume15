import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ClientChrome } from "@/components/ClientChrome";
import "./globals.css";

const fontSans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const fontMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Big Tech Resume Review | MAANG-Ready Resume Analyzer",
  description:
    "AI-powered resume review for MAANG and Big Tech. Get section-by-section feedback, scores, and rewrites to land elite roles.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fontSans.variable} ${fontMono.variable}`}>
      <body className="min-h-screen antialiased font-sans bg-[var(--surface)] text-[var(--text)] relative">
        {/* Decorative background layers (product-deck style) */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
          <div className="absolute inset-0 bg-noise" />
          <div className="absolute top-0 left-0 w-[280px] h-[280px] bg-dots opacity-80" />
          <div className="absolute bottom-0 right-0 w-full h-full bg-arcs" />
        </div>
        <div className="relative z-0 min-h-screen">
          {children}
          <ClientChrome />
        </div>
      </body>
    </html>
  );
}
