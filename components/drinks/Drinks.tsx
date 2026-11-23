import { cafe, formatPrice, type DrinkItem } from "@/lib/cafe";
import { Float } from "./Float";

/** Hot and iced prices are always both shown. */
function Price({ item }: { item: DrinkItem }) {
  if (item.price != null) return <span className="tabular-nums">{formatPrice(item.price)}</span>;
  return (
    <span className="price-pair">
      <span>{item.hot != null && <><small>Hot</small> {formatPrice(item.hot)}</>}</span>
      <span aria-hidden="true" className="price-slash">
        {item.hot != null && item.iced != null && "/"}
      </span>
      <span>{item.iced != null && <><small>Iced</small> {formatPrice(item.iced)}</>}</span>
    </span>
  );
}

export function Drinks() {
  const { sections, notes } = cafe.drinks;
  const [blackWhite, signature, fizzy, tea] = sections;
  const column = (list: typeof sections) =>
    list.map((section) => (
      <div key={section.id}>
        <h3 className="font-display border-b-2 border-[var(--liquid-line)] pb-3 text-[clamp(26px,2.4vw,32px)] font-normal">
          {section.title}
        </h3>
        {section.description && (
          <p className="mt-2 text-lg text-latte-ink">{section.description}</p>
        )}
        <ul className="mt-2">
          {section.items.map((item) => (
            <li key={item.name} className="float-row flex items-baseline gap-3 py-2.5 text-[19px]">
              <span>
                {item.name}
                {item.note && item.note !== "Hot only" && (
                  <span className="drink-tag ml-2">{item.note.toLowerCase()}</span>
                )}
              </span>
              <span className="drink-leader" aria-hidden="true" />
              <Price item={item} />
            </li>
          ))}
        </ul>
      </div>
    ));

  return (
    <section
      id="drinks"
      aria-labelledby="drinks-title"
      className="bg-latte px-6 pb-32 pt-12 text-liquid-ink sm:px-10 sm:pb-40"
    >
      <div className="mx-auto max-w-[1200px]">
        <h2 id="drinks-title" className="font-display text-[clamp(52px,8vw,96px)] font-normal leading-none">
          Drinks
        </h2>
        <ul className="mt-8 flex flex-wrap gap-2">
          {notes.map((n) => (
            <li key={n} className="rounded-full border border-[var(--liquid-line)] px-4 py-1.5 text-base">
              {n}
            </li>
          ))}
        </ul>

        <Float className="mt-14 grid gap-x-16 gap-y-14 lg:grid-cols-3">
          {column([blackWhite])}
          {column([signature])}
          <div className="flex flex-col gap-14">{column([fizzy, tea])}</div>
        </Float>
      </div>
    </section>
  );
}
