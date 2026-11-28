import { cafe } from "@/lib/cafe";
import { DrinksMenu } from "./DrinksMenu";

/**
 * The Drinks menu resting inside the poured latte wave.
 * Keeps the header and coffee notes server-rendered while delegating
 * filtering, temperature focus, and cake-pairing badges to DrinksMenu.
 */
export function Drinks() {
  const { sections, notes } = cafe.drinks;

  return (
    <section
      id="drinks"
      aria-labelledby="drinks-title"
      className="bg-latte px-6 pb-20 pt-12 text-liquid-ink sm:px-10 sm:pb-28"
    >
      <div className="mx-auto max-w-[1200px]">
        <h2
          id="drinks-title"
          className="font-display text-[clamp(52px,8vw,96px)] font-normal leading-none"
        >
          Drinks
        </h2>
        <ul className="mt-8 flex flex-wrap gap-2">
          {notes.map((note) => (
            <li
              key={note}
              className="rounded-full border border-[var(--liquid-line)] px-4 py-1.5 text-base"
            >
              {note}
            </li>
          ))}
        </ul>

        <DrinksMenu sections={sections} />
      </div>
    </section>
  );
}
