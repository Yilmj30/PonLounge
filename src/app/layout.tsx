import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { PHONE_E164, CONTACT_EMAIL, ADDRESS_LINE } from "@/lib/config";
import { VENUE_OPEN_TIME } from "@/lib/hours";
import "./globals.css";

const displayFont = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["500", "600", "700"],
});

const bodyFont = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3100";
const title = "PON Lounge — La Sala del Tiempo";
const description =
  "PON Lounge: un lounge VIP en Medellín, una oda al tiempo y al lujo. Donde el tiempo se detiene y el lujo no tiene hora.";
const ogImage = "/photos/hero-reloj-tiempo.png";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s · PON Lounge",
  },
  description,
  keywords: [
    "PON Lounge",
    "lounge VIP Medellín",
    "bar de cócteles Medellín",
    "coctelería de autor",
    "reservas bar Medellín",
  ],
  robots: {
    index: process.env.NEXT_PUBLIC_ENV === "production",
    follow: process.env.NEXT_PUBLIC_ENV === "production",
  },
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: "PON Lounge",
    locale: "es_CO",
    type: "website",
    images: [{ url: ogImage, width: 1448, height: 1086, alt: title }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [ogImage],
  },
};

// LocalBusiness structured data (schema.org) so Google can show PON Lounge
// as a rich result — hours/phone/email/address are the same values shown
// in the UI (src/lib/hours.ts, src/lib/config.ts).
const businessJsonLd = {
  "@context": "https://schema.org",
  "@type": "BarOrPub",
  name: "PON Lounge",
  description,
  url: siteUrl,
  image: `${siteUrl}${ogImage}`,
  telephone: PHONE_E164,
  email: CONTACT_EMAIL,
  priceRange: "$$$",
  address: {
    "@type": "PostalAddress",
    streetAddress: ADDRESS_LINE.split(",")[0],
    addressLocality: "Medellín",
    addressRegion: "Antioquia",
    addressCountry: "CO",
  },
  openingHoursSpecification: [
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ].map((dayOfWeek) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek,
    opens: VENUE_OPEN_TIME,
    closes: "23:59",
  })),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${displayFont.variable} ${bodyFont.variable} h-full antialiased`}
    >
      <body className="bg-obsidian text-cream flex min-h-full flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(businessJsonLd) }}
        />
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
