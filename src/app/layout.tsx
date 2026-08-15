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
  title: "BridgeControl — Keys never leave. Spend never surprises.",
  description:
    "Zero-trust local-first API gateway + CostRadar kill-switch. Web Locks, File System Access, AES-GCM. Secrets never hit our servers.",
  metadataBase: new URL("https://promptslaktaren.vercel.app"),
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "BridgeControl — Keys never leave. Spend never surprises.",
    description:
      "Weld .env on-device. Web Locks. Budget kill-switch. No secret on our servers.",
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
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100">
        {children}
      </body>
    </html>
  );
}
