import {
  InstagramIcon,
  PhoneIcon,
  WhatsAppIcon,
} from "@/components/ContactIcons";
import { cafe, getFullAddress, getWhatsAppUrl } from "@/lib/cafe";
import { summarizeHours } from "@/lib/hours/format";
import type { OpeningHours } from "@/lib/hours/types";
import { LazyMap } from "./LazyMap";
import { OpenBadge } from "./OpenBadge";
import { CopyAddressButton, HoursSchedule } from "./QuickActions";

const label =
  "font-display mb-2 text-xs font-bold uppercase tracking-[0.16em] text-milk/55";

export function FindUs({ hours }: { hours: OpeningHours }) {
  const { location, phone, instagram } = cafe;
  const rows = summarizeHours(hours);
  // "Clap Cafe" is how Google lists the place, so the embed lands on the cafe's own pin.
  const mapQuery = `${cafe.name} Cafe, ${location.building} ${location.street} ${location.city} ${location.postalCode}`;
  const tel = phone.replace(/\s/g, "");
  const fullAddress = getFullAddress();
  const whatsappUrl = getWhatsAppUrl(
    "Hi Clap Cafe! I'd like to check today's cake availability.",
  );

  return (
    <section
      id="find"
      aria-labelledby="find-title"
      className="min-h-[960px] bg-case px-6 pb-36 pt-24 text-milk sm:px-10"
    >
      <div className="mx-auto max-w-[1200px]">
        <h2
          id="find-title"
          className="font-display text-[clamp(52px,8vw,96px)] font-normal leading-none text-milk"
        >
          Find us
        </h2>

        <div className="mt-12 flex flex-col gap-12">
          <LazyMap
            query={mapQuery}
            title={`Map showing ${cafe.name} at ${location.building}`}
          />

          <div className="grid gap-x-10 gap-y-8 text-[19px] leading-relaxed sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <h3 className={label}>Address</h3>
              <address className="not-italic text-milk/95">
                {location.building}
                <br />
                {location.street}
                <br />
                {location.city} {location.postalCode}
              </address>
              <CopyAddressButton address={fullAddress} />
            </div>

            <div>
              <h3 className={label}>Hours</h3>
              <HoursSchedule rows={rows} timezone={hours.timezone} />
            </div>

            <div>
              <h3 className={label}>Contact</h3>
              <p>
                <a
                  className="inline-flex min-h-11 items-center gap-2.5 text-milk/95 underline decoration-milk/45 decoration-1 underline-offset-4 transition-colors hover:text-milk hover:decoration-milk"
                  href={`tel:${tel}`}
                >
                  <PhoneIcon />
                  {phone}
                </a>
                <br />
                <a
                  className="inline-flex min-h-11 items-center gap-2.5 text-milk/95 underline decoration-milk/45 decoration-1 underline-offset-4 transition-colors hover:text-milk hover:decoration-milk"
                  href={`https://www.instagram.com/${instagram}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <InstagramIcon />@{instagram}
                </a>
              </p>
            </div>

            <div className="flex flex-col items-start gap-4">
              <OpenBadge hours={hours} />
              <div className="flex flex-wrap gap-3">
                <a
                  href={location.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center rounded-full bg-milk px-6 text-[16px] text-espresso transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-led"
                >
                  Get directions
                </a>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/25 bg-white/[0.06] px-5 text-[16px] text-milk transition-colors hover:border-white/50 hover:bg-white/[0.12] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-led"
                >
                  <WhatsAppIcon />
                  <span>WhatsApp us</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
