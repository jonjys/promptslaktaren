import type { Metadata, Viewport } from "next";
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
    "Secret-slussen som tar 3% av all API-trafik. Weld · Lock · Kill 2.0 · Proxy. Zero-trust local-first.",
  metadataBase: new URL("https://promptslaktaren.vercel.app"),
  manifest: "/manifest.webmanifest",
  applicationName: "BridgeControl",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BridgeControl",
  },
  openGraph: {
    title: "BridgeControl — Keys never leave. Spend never surprises.",
    description:
      "Weld .env on-device. Web Locks. Kill Switch 2.0. Proxy with 3% take. No secret on our servers.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#00FF88",
  width: "device-width",
  initialScale: 1,
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
      <body className="min-h-full flex flex-col bg-black text-zinc-100">
        {children}
      </body>
    </html>
  );
}
