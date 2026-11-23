import { Dock } from "@/components/chrome/Dock";
import { Cakes } from "@/components/cakes/Cakes";
import { Drinks } from "@/components/drinks/Drinks";
import { FindUs } from "@/components/find/FindUs";
import { Footer } from "@/components/Footer";
import { PourStage } from "@/components/hero/PourStage";
import { cafe } from "@/lib/cafe";
import { getOpeningHours } from "@/lib/hours/source";
import { buildJsonLd } from "@/lib/seo";

export default async function Home() {
  const hours = await getOpeningHours();
  // JSON-LD is built from our own data; "<" is escaped so it can never close the script tag.
  const jsonLd = JSON.stringify(buildJsonLd(hours)).replace(/</g, "\\u003c");

  return (
    <div className="flex min-h-svh flex-col">
      <main className="flex-1">
        <PourStage>
          <h1 className="sr-only">{cafe.name}</h1>
        </PourStage>
        <Drinks />
        <Cakes />
        <FindUs hours={hours} />
      </main>

      <Footer hours={hours} />
      <Dock />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
    </div>
  );
}
