import type { Metadata } from "next";
import { Geist, Geist_Mono, Oswald, Playpen_Sans } from "next/font/google";
import "@/styles/globals.css";
import Providers from "./providers";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import { Toaster } from "sonner";
import StructuredData from "@/components/StructuredData";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
});

const playpenSans = Playpen_Sans({
  variable: "--font-playpen-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CHO A CHO Store",
  description: "Online store of CHO A CHO brand of chocolate",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="apple-mobile-web-app-title" content="CHO A CHO" />
        <meta name="application-name" content="CHO A CHO" />
        <meta name="msapplication-TileColor" content="#ffffff" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        <link rel="icon" href="/favicon.ico?v=2" />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png?v=2"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png?v=2"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
      </head>

      <body
        className={`${geistSans.variable} ${geistMono.variable} ${oswald.variable} ${playpenSans.variable} antialiased`}
      >
        <Providers>
          <StructuredData />
          <Header />
          {children}
          <Footer />
          <Toaster richColors position="bottom-right" />
        </Providers>

        {/* ✅ Vercel Analytics components */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
