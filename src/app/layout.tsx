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
  title: "PromptSlaktaren \u2013 Write one word. Get an app.",
  description:
    "One word \u2192 15-point prompt for Claude, Grok, Meta AI, Venice AI. Next.js + Supabase + Stripe. EN & SV. Top of funnel for Fred-platform.",
  metadataBase: new URL("https://promptslaktaren.vercel.app"),
  openGraph: {
    title: "PromptSlaktaren \u2013 Write one word. Get an app.",
    description:
      "One word \u2192 15-point prompt. Copy-paste into any AI and ship. Part of the Fred ecosystem.",
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
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        {children}
      </body>
    </html>
  );
}
