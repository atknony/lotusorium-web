import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

// Serif display for headings — warm, organic, optical-sized.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin", "latin-ext"], // latin-ext carries Turkish ş ğ ı İ
  display: "swap",
});

// Clean sans for body/UI.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Lotusorium — Butik Mum ve Ahşap Mutfak Dekorasyonu",
    template: "%s · Lotusorium",
  },
  description:
    "El yapımı mumlar, ahşap mutfak dekorasyonu ve mum yapım malzemeleri. Lotusorium butik koleksiyonunu keşfedin.",
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "Lotusorium",
    images: [
      { url: "/logo.png", width: 1080, height: 1080, alt: "Lotusorium" },
    ],
  },
  twitter: {
    // Square brand mark → the compact "summary" card, not large-image.
    card: "summary",
    title: "Lotusorium — Butik Mum ve Ahşap Mutfak Dekorasyonu",
    description:
      "El yapımı mumlar, ahşap mutfak dekorasyonu ve mum yapım malzemeleri.",
    images: ["/logo.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#faf7f2",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // pairs with safe-area insets for the mobile shell
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${fraunces.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}