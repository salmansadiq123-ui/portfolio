import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Bricolage_Grotesque, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import Cursor from "@/components/Cursor";
import Nav from "@/components/Nav";
import { themeScript } from "@/components/themeScript";
import { profile } from "@/data/profile";
import { jsonLd, siteJsonLd } from "@/lib/seo";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-serif", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

const GA_ID = "G-E1LZ7M1FLD";

export const metadata: Metadata = {
  metadataBase: new URL(profile.site),
  title: { default: "Salman Sadiq — Graphic Designer & QA Engineer", template: "%s — Salman Sadiq" },
  description:
    "Portfolio of Salman Sadiq, Graphic Designer & QA Engineer at Kakushin, Rawalpindi. Brand identity, social campaigns, editorial design and product QA.",
  // Defaults only — each page sets its own canonical, og:url and titles via pageMeta().
  openGraph: {
    siteName: profile.name,
    images: [{ url: "/og.jpg", width: 1200, height: 630 }],
    type: "website",
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", images: ["/og.jpg"] },
  authors: [{ name: profile.name, url: profile.site }],
  creator: profile.name,
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0d0c0b" },
    { media: "(prefers-color-scheme: light)", color: "#f4efe6" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(siteJsonLd)} />
      </head>
      <body className={`${display.variable} ${serif.variable} ${mono.variable}`}>
        <SmoothScroll />
        <Cursor />
        <Nav />
        {children}
        <div className="grain" aria-hidden />
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        <Script id="ga4" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
        </Script>
      </body>
    </html>
  );
}
