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
  title: "BridgeControl — Your API keys never leave your machine",
  description:
    "Zero-trust local-first API gateway. File System Access + Web Locks + WebCrypto. Keys stay on device. Usage metered.",
  metadataBase: new URL("https://promptslaktaren.vercel.app"),
  openGraph: {
    title: "BridgeControl — Your API keys never leave your machine",
    description:
      "Zero-trust API gateway that runs in your browser. No key on our servers.",
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
