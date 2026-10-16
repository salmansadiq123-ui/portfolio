import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import Cursor from "@/components/Cursor";
import Nav from "@/components/Nav";
import { profile } from "@/data/profile";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-serif", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(profile.site),
  title: { default: "Salman Sadiq — Graphic Designer & QA Engineer", template: "%s — Salman Sadiq" },
  description:
    "Portfolio of Salman Sadiq, Graphic Designer & QA Engineer at Kakushin, Rawalpindi. Brand identity, social campaigns, editorial design and product QA.",
  openGraph: {
    title: "Salman Sadiq — Graphic Designer & QA Engineer",
    description: "Brand identity, social campaigns, editorial design and product QA.",
    url: profile.site,
    siteName: "Salman Sadiq",
    images: [{ url: "/og.jpg", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#0d0c0b", viewportFit: "cover" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${serif.variable} ${mono.variable}`}>
        <SmoothScroll />
        <Cursor />
        <Nav />
        {children}
        <div className="grain" aria-hidden />
      </body>
    </html>
  );
}
