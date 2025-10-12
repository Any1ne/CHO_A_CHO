import type { Metadata } from "next";
import Script from "next/script"; 
import { Geist, Geist_Mono, Oswald, Playpen_Sans } from "next/font/google";
import "@/styles/globals.css";
import Providers from "./providers";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import { Toaster } from "sonner";
import StructuredData from "@/components/StructuredData";
import { BasketInit } from "@/components/Basket/BasketInit";

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
  title: "CHO A CHO Store – Handmade Ukrainian Chocolate",
  description:
    "Delicious handmade chocolate from Ukraine. Buy exclusive CHO A CHO treats for yourself or your business.",
  keywords: [
    "handmade chocolate",
    "Ukrainian chocolate",
    "CHO A CHO",
    "buy chocolate online",
    "craft sweets",
    "chocolate gifts",
  ],
  authors: [{ name: "Arthur Dombrovskiy", url: "https://www.choacho.com.ua" }],
  creator: "CHO A CHO",
  metadataBase: new URL("https://www.choacho.com.ua"),
  openGraph: {
    title: "CHO A CHO – Handmade Ukrainian Chocolate",
    description:
      "Explore delicious artisan chocolate crafted in Ukraine. Order online, with delivery and gift options.",
    url: "https://www.choacho.com.ua",
    siteName: "CHO A CHO",
    type: "website",
    images: [
      {
        url: "https://www.choacho.com.ua/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "CHO A CHO Handmade Chocolate",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CHO A CHO – Handmade Ukrainian Chocolate",
    description:
      "Buy artisan chocolate online. Unique sweets from Ukraine – CHO A CHO.",
    images: ["https://www.choacho.com.ua/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* ✅ Google Tag Manager – head script */}
        <Script id="gtm-init" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-T5PX6PBP');
          `}
        </Script>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="apple-mobile-web-app-title" content="CHO A CHO" />
        <meta name="application-name" content="CHO A CHO" />
        <meta name="msapplication-TileColor" content="#ffffff" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta property="og:title" content="CHO A CHO Store" />
        <meta
          property="og:description"
          content="Delicious handmade chocolate from Ukraine – explore our exclusive CHO A CHO collections."
        />
        <meta
          property="og:image"
          content="https://www.choacho.com.ua/og-image.jpg"
        />
        <meta property="og:url" content="https://www.choacho.com.ua/" />
        <meta property="og:site_name" content="CHO A CHO" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://www.choacho.com.ua/" />
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
        <meta name="mobile-web-app-capable" content="yes" />
      </head>

      <body
        className={`${geistSans.variable} ${geistMono.variable} ${oswald.variable} ${playpenSans.variable} antialiased`}
      >
        {/* ✅ Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-T5PX6PBP"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          ></iframe>
        </noscript>
        <Providers>
          <StructuredData />
          <Header />
          <BasketInit />
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
