import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Arvo, Sniglet } from "next/font/google";
import { cafe } from "@/lib/cafe";
import { SITE_URL } from "@/lib/seo";
import "./globals.css";

const arvo = Arvo({
  subsets: ["latin"],
  variable: "--font-arvo",
  weight: ["400", "700"],
  display: "swap",
});

const sniglet = Sniglet({
  subsets: ["latin"],
  variable: "--font-sniglet",
  weight: "400",
  display: "swap",
});

const title = `${cafe.name} — Coffee & cakes at ${cafe.location.building}, Singapore`;
const description = `${cafe.tagline} ${cafe.location.building}, ${cafe.location.street}, ${cafe.location.city} ${cafe.location.postalCode}.`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: cafe.name,
    title,
    description,
    locale: "en_SG",
    url: "/",
  },
  twitter: { card: "summary_large_image", title, description },
};

export const viewport: Viewport = {
  themeColor: "#f5f0e9",
};

/**
 * Runs before first paint. Decides — synchronously, so there's no flash — whether
 * the animated experience is on:
 *   js-motion: JS is running and the user hasn't asked for reduced motion
 *   js-loader: additionally, there's no #hash (deep links skip the intro)
 * Without JS or with reduced motion neither class is added, and the page is the
 * static, fully scrollable version. The timeout is a failsafe so a failed bundle
 * can never leave the page scroll-locked.
 */
const gatingScript = `(function(){var d=document.documentElement;try{localStorage.removeItem('clap-temp')}catch(e){}try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;d.classList.add('js-motion');if(!location.hash){d.classList.add('js-loader');setTimeout(function(){d.classList.remove('js-loader')},12000)}}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${arvo.variable} ${sniglet.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: gatingScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
