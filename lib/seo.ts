import { cafe } from "@/lib/cafe";
import { DAY_NAMES, type OpeningHours } from "@/lib/hours/types";
import { summarizeHours } from "@/lib/hours/format";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

/** schema.org CafeOrCoffeeShop, built only from fields in cafe-data.json. */
export function buildJsonLd(hours: OpeningHours) {
  const { location, phone, instagram } = cafe;
  const openingHoursSpecification = summarizeHours(hours)
    .filter((r) => r.hours)
    .map((r) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: r.days.map((d) => DAY_NAMES[d]),
      opens: r.hours![0],
      closes: r.hours![1],
    }));

  return {
    "@context": "https://schema.org",
    "@type": "CafeOrCoffeeShop",
    name: cafe.name,
    description: cafe.tagline,
    url: SITE_URL,
    telephone: phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: `${location.street}, ${location.building}`,
      addressLocality: location.city,
      postalCode: location.postalCode,
      addressCountry: "SG",
    },
    openingHoursSpecification,
    hasMap: location.mapsUrl,
    sameAs: [`https://www.instagram.com/${instagram}/`],
  };
}
