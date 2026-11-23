import { InstagramIcon, PhoneIcon } from "@/components/ContactIcons";
import { cafe } from "@/lib/cafe";
import { summarizeHours } from "@/lib/hours/format";
import type { OpeningHours } from "@/lib/hours/types";

const head = "mb-2 text-sm font-semibold uppercase tracking-[0.14em]";

/** Flush to the bottom of the page: the pink at the foot of the ribbed glass. */
export function Footer({ hours }: { hours: OpeningHours }) {
  const { location, phone, instagram } = cafe;
  const rows = summarizeHours(hours);
  return (
    <footer className="footer-glass px-6 pb-36 pt-20 text-espresso sm:px-10">
      <div className="mx-auto flex max-w-[1200px] flex-wrap justify-between gap-x-16 gap-y-10">
        <div className="max-w-sm">
          <p className="font-display text-6xl font-normal leading-none">Clap Cafe</p>
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
            {rows.map((r) => (
              <p key={r.label}>
                {r.label}
                <br />
                {r.text}
              </p>
            ))}
          </div>
          <div>
            <h2 className={head}>Say hi</h2>
            <p>
              <a className="inline-flex min-h-11 items-center gap-2.5 underline underline-offset-4" href={`https://www.instagram.com/${instagram}/`} target="_blank" rel="noopener noreferrer">
                <InstagramIcon />
                @{instagram}
              </a>
              <br />
              <a className="inline-flex min-h-11 items-center gap-2.5 underline underline-offset-4" href={`tel:${phone.replace(/\s/g, "")}`}>
                <PhoneIcon />
                {phone}
              </a>
            </p>
          </div>
        </div>
      </div>
      <p className="mx-auto mt-16 max-w-[1200px] border-t border-espresso/30 pt-5 text-sm">
        © Clap Cafe
      </p>
    </footer>
  );
}
