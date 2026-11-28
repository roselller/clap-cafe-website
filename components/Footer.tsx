import {
  InstagramIcon,
  PhoneIcon,
  WhatsAppIcon,
} from "@/components/ContactIcons";
import { BackToTopButton } from "@/components/BackToTopButton";
import { cafe, getWhatsAppUrl } from "@/lib/cafe";
import { summarizeHours } from "@/lib/hours/format";
import type { OpeningHours } from "@/lib/hours/types";

const head =
  "font-display mb-2 text-xs font-bold uppercase tracking-[0.16em]";

/** Flush to the bottom of the page: the pink at the foot of the ribbed glass. */
export function Footer({ hours }: { hours: OpeningHours }) {
  const { location, phone, instagram } = cafe;
  const rows = summarizeHours(hours);
  const whatsappUrl = getWhatsAppUrl(
    "Hi Clap Cafe! I'd like to enquire about your cakes.",
  );

  return (
    <footer className="footer-glass px-6 pb-36 pt-20 text-espresso sm:px-10">
      <div className="mx-auto flex max-w-[1200px] flex-wrap justify-between gap-x-16 gap-y-10">
        <div className="max-w-sm">
          <p className="font-display text-6xl font-normal leading-none">
            Clap Cafe
          </p>
          <p className="mt-4 text-lg leading-snug">{cafe.tagline}</p>
        </div>

        <div className="flex flex-wrap gap-x-14 gap-y-8 text-[17px] leading-relaxed">
          <div>
            <h2 className={head}>Visit</h2>
            <p>
              {location.building}
              <br />
              {location.street}
              <br />
              {location.city} {location.postalCode}
            </p>
          </div>

          <div>
            <h2 className={head}>Hours</h2>
            {rows.map((row) => (
              <p key={row.label}>
                {row.label}
                <br />
                {row.text}
              </p>
            ))}
          </div>

          <div>
            <h2 className={head}>Say hi</h2>
            <p>
              <a
                className="inline-flex min-h-11 items-center gap-2.5 underline underline-offset-4 hover:decoration-2"
                href={`https://www.instagram.com/${instagram}/`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <InstagramIcon />@{instagram}
              </a>
              <br />
              <a
                className="inline-flex min-h-11 items-center gap-2.5 underline underline-offset-4 hover:decoration-2"
                href={`tel:${phone.replace(/\s/g, "")}`}
              >
                <PhoneIcon />
                {phone}
              </a>
              <br />
              <a
                className="inline-flex min-h-11 items-center gap-2.5 underline underline-offset-4 hover:decoration-2"
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <WhatsAppIcon />
                WhatsApp
              </a>
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-16 flex max-w-[1200px] flex-wrap items-center justify-between gap-4 border-t border-espresso/30 pt-5 text-sm">
        <p className="max-w-2xl leading-relaxed text-espresso/85">
          Unofficial concept project — not affiliated with Clap Cafe. Menu
          items, descriptions, allergens &amp; imagery are inferred for
          demonstration and do not reflect official listings.
        </p>
        <BackToTopButton />
      </div>
    </footer>
  );
}
