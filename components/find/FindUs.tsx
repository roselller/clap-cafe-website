import { InstagramIcon, PhoneIcon } from "@/components/ContactIcons";
import { cafe } from "@/lib/cafe";
import { summarizeHours } from "@/lib/hours/format";
import type { OpeningHours } from "@/lib/hours/types";
import { LazyMap } from "./LazyMap";
import { OpenBadge } from "./OpenBadge";

const label = "mb-1 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--page-ink-2)]";

export function FindUs({ hours }: { hours: OpeningHours }) {
  const { location, phone, instagram } = cafe;
  const rows = summarizeHours(hours);
  // "Clap Cafe" is how Google lists the place, so the embed lands on the cafe's own pin.
  const mapQuery = `${cafe.name} Cafe, ${location.building} ${location.street} ${location.city} ${location.postalCode}`;
  const tel = phone.replace(/\s/g, "");

  return (
    <section id="find" aria-labelledby="find-title" className="min-h-[1080px] bg-[var(--page-bg)] px-6 pb-40 pt-24 text-[var(--page-ink)] sm:px-10">
      <div className="mx-auto max-w-[1200px]">
        <h2 id="find-title" className="font-display text-[clamp(52px,8vw,96px)] font-normal leading-none">
          Find us
        </h2>

        <div className="mt-12 flex flex-col gap-12">
          <LazyMap query={mapQuery} title={`Map showing ${cafe.name} at ${location.building}`} />

          <div className="grid gap-x-10 gap-y-8 text-[19px] leading-relaxed sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <h3 className={label}>Address</h3>
              <address className="not-italic">
                {location.building}
                <br />
                {location.street}
                <br />
                {location.city} {location.postalCode}
              </address>
            </div>
            <div>
              <h3 className={label}>Hours</h3>
              <dl>
                {rows.map((r) => (
                  <div key={r.label} className="flex gap-4">
                    <dt className="min-w-16 font-medium">{r.label}</dt>
                    <dd>{r.text}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div>
              <h3 className={label}>Contact</h3>
              <p>
                <a className="inline-flex min-h-11 items-center gap-2.5 underline decoration-1 underline-offset-4 hover:decoration-2" href={`tel:${tel}`}>
                  <PhoneIcon />
                  {phone}
                </a>
                <br />
                <a
                  className="inline-flex min-h-11 items-center gap-2.5 underline decoration-1 underline-offset-4 hover:decoration-2"
                  href={`https://www.instagram.com/${instagram}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <InstagramIcon />
                  @{instagram}
                </a>
              </p>
            </div>
            <div className="flex flex-col items-start gap-5">
              <OpenBadge hours={hours} />
              <a
                href={location.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center rounded-full bg-[var(--btn-bg)] px-7 text-[17px] font-semibold text-[var(--btn-ink)] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--page-ink)]"
              >
                Get directions
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
