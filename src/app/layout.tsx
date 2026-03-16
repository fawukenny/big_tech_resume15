import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
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
      <body className="min-h-screen antialiased font-sans bg-[var(--surface)] text-[var(--text)]">
        {children}
      </body>
    </html>
  );
}
