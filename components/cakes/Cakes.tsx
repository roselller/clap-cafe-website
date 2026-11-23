import { cafe, formatPrice } from "@/lib/cafe";
import { CakeDome } from "./CakeDome";

function Row({ label, price }: { label: string; price: number }) {
  return (
    <p className="flex items-baseline gap-3 py-1.5 text-[19px]">
      <span>{label}</span>
      <span className="flex-1 translate-y-[-5px] border-b-2 border-dotted border-white/30" aria-hidden="true" />
      <span className="tabular-nums">{formatPrice(price)}</span>
    </p>
  );
}

export function Cakes() {
  const { cakes, warmCakes, iceCream, sandwiches } = cafe.food;
  // three cakes to a shelf, like the real counter
  const shelves = [0, 1, 2].map((i) => cakes.items.slice(i * 3, i * 3 + 3));
  const card = "rounded-[10px] border border-white/20 p-6";
  const cardTitle = "font-display mb-3 text-2xl font-normal";

  return (
    <section id="cakes" aria-labelledby="cakes-title" className="bg-case py-24 text-milk sm:py-32">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-end justify-between gap-x-10 gap-y-4 px-6 sm:px-10">
        <h2 id="cakes-title" className="font-display text-[clamp(52px,8vw,96px)] font-normal leading-none">
          Cakes
        </h2>
        <p className="text-lg text-white/80">{cakes.description}</p>
      </div>

      {/* The glass display case: full width, lit from above, three shelves. */}
      <div className="relative mt-14 overflow-hidden border-y border-white/15 bg-case">
        <div className="h-1.5 bg-led" aria-hidden="true" />
        {[12, 30, 48, 66, 84].map((left) => (
          <span
            key={left}
            aria-hidden="true"
            className="pointer-events-none absolute -top-10 bottom-0 w-14 -skew-x-[24deg] bg-white/[0.045]"
            style={{ left: `${left}%` }}
          />
        ))}
        {shelves.map((shelf, i) => (
          <div key={i}>
            <ul className="mx-auto flex max-w-[1100px] snap-x snap-mandatory gap-6 overflow-x-auto px-6 pb-3 pt-16 md:grid md:grid-cols-3 md:gap-10 md:overflow-visible md:px-12">
              {shelf.map((cake) => (
                <CakeDome key={cake.name} cake={cake} />
              ))}
            </ul>
            <div className="mb-2 h-1.5 bg-white/20" aria-hidden="true" />
            {i < shelves.length - 1 && <div className="h-1.5 bg-led/90" aria-hidden="true" />}
          </div>
        ))}
        <div className="h-3 bg-case-base" aria-hidden="true" />
      </div>

      <div className="mx-auto mt-12 grid max-w-[1200px] gap-5 px-6 sm:px-10 md:grid-cols-3">
        <div className={card}>
          <h3 className={cardTitle}>Warm cake</h3>
          {warmCakes.map((c) => (
            <Row key={c.name} label={c.name} price={c.price} />
          ))}
        </div>
        <div className={card}>
          <h3 className={cardTitle}>Ice cream</h3>
          <p className="mb-1 text-lg text-white/80">{iceCream.flavours.join(" or ")}</p>
          <Row label="Single" price={iceCream.single} />
          <Row label="Double" price={iceCream.double} />
        </div>
        <div className={card}>
          <h3 className={cardTitle}>Sandwich</h3>
          {sandwiches.map((s) => (
            <div key={s.name}>
              <Row label={s.name} price={s.price} />
              {s.note && <p className="drink-tag !text-white/80">{s.note.toLowerCase()}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
