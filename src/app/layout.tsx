import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PromptSlaktaren – Skriv ett ord. Få en app.",
  description:
    "Ett ord → 15-punkts prompt som funkar i Claude, Grok, Meta AI, Venice AI. Bygg Next.js + Supabase + Stripe-appar på sekunder.",
  metadataBase: new URL("https://promptslaktaren.se"),
  openGraph: {
    title: "PromptSlaktaren – Skriv ett ord. Få en app.",
    description:
      "Ett ord → 15-punkts prompt. Copy-paste in i valfri AI och shippa.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="sv"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        {children}
      </body>
    </html>
  );
}
