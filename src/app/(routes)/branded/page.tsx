import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BUILDER_SHAPES } from "@/config/builder-shapes";
import type { PriceTier } from "@/types/builder";
import CoverCycler from "@/components/Builder/shell/CoverCycler";

// Phase 34: greeting-card cover cycles through both card sides AND
// two real-world example shots. Sequential order so the buyer sees
// outer → inner → example → example → loop, hitting all four assets
// in 20 s.
const GREETING_CARD_COVER_SRCS = [
  "/builder/greeting-card/outer.png",
  "/builder/greeting-card/inner.png",
  "/builder/greeting-card/pidtrimka.webp",
  "/builder/greeting-card/idermik.webp",
];

export const metadata: Metadata = {
  title: "Брендована упаковка | Cho a Cho B2B",
  description:
    "Шоколад і листівки з вашим логотипом. Оберіть формат і створіть власний дизайн на пакуванні.",
};

// Ukrainian plural for cardinals (1 / 2-4 / 5+ with the 11-14 exception).
function pluralize(count: number, forms: [string, string, string]): string {
  const last = count % 10;
  const lastTwo = count % 100;
  if (lastTwo >= 11 && lastTwo <= 14) return forms[2];
  if (last === 1) return forms[0];
  if (last >= 2 && last <= 4) return forms[1];
  return forms[2];
}

// Format a per-piece price like "19.5" without a trailing ".0" — drop the
// decimal entirely when the value is a whole number.
function formatPricePerPiece(n: number): string {
  if (Number.isInteger(n)) return n.toString();
  return n.toFixed(2).replace(/0$/, "").replace(/\.$/, "");
}

function PriceTiersList({ tiers }: { tiers: PriceTier[] }) {
  const sorted = [...tiers].sort((a, b) => a.minQuantity - b.minQuantity);
  return (
    <ul className="mt-4 divide-y divide-stone-100 rounded-md border border-stone-200 bg-stone-50/60 text-xs lg:text-sm">
      {sorted.map((tier, idx) => {
        const next = sorted[idx + 1];
        const label = next
          ? `${tier.minQuantity}–${next.minQuantity - 1} шт`
          : `${tier.minQuantity}+ шт`;
        return (
          <li
            key={tier.minQuantity}
            className="flex items-center justify-between px-3 py-1.5"
          >
            <span className="text-stone-500">{label}</span>
            <span className="font-semibold tabular-nums text-stone-900">
              {formatPricePerPiece(tier.pricePerPiece)} ₴/шт
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export default function BrandedPage() {
  const shapes = Object.values(BUILDER_SHAPES);

  return (
    <main className="mt-[6rem] md:mt-[8rem] min-h-[65vh] bg-stone-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        <header className="mb-8 lg:mb-12 max-w-2xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-700">
            Для бізнесу і подарунків
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-stone-900">
            Брендована упаковка
          </h1>
          <p className="mt-3 text-base lg:text-lg leading-relaxed text-stone-600">
            Створіть власний дизайн на шоколаді чи листівці: завантажте логотип,
            додайте текст і отримайте готове прев&apos;ю — без узгоджень із
            дизайнером і без замовлення зразка.
          </p>
        </header>

        <section className="mb-10 rounded-2xl border border-amber-200 bg-amber-50/50 p-5 lg:mb-14 lg:p-8">
          <h2 className="text-xl font-semibold text-stone-900 lg:text-2xl">
            Корпоративні замовлення з логотипом
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-stone-600 lg:text-base">
            Шоколад із логотипом для корпоративних подарунків, презентацій і
            подяк клієнтам. Ціна автоматично знижується при збільшенні
            кількості — три тарифні рівні від 100, 500 та 1000 шт.
          </p>
          <Link
            href="/builder/mini"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800"
          >
            Створити дизайн
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {shapes.map((shape) => {
            const isTemplate = shape.mode === "template";
            const count = shape.flavors.length;
            const noun = isTemplate
              ? pluralize(count, ["шаблон", "шаблони", "шаблонів"])
              : pluralize(count, ["смак", "смаки", "смаків"]);

            // Phase 34: every shape's cover cycles. Greeting card runs
            // sequentially through the four example assets; chocolates
            // pick a random flavor each tick so the breadth of the
            // range is visible without making the buyer scroll the
            // builder.
            const isGreetingCard = shape.id === "greeting-card";
            const coverSrcs = isGreetingCard
              ? GREETING_CARD_COVER_SRCS
              : shape.flavors
                  .map((f) => f.imageSrc)
                  .filter((s): s is string => Boolean(s));

            return (
              <Link
                key={shape.id}
                href={`/builder/${shape.id}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
                  {coverSrcs.length > 0 && (
                    <CoverCycler
                      srcs={coverSrcs}
                      alt={shape.name}
                      mode={isGreetingCard ? "sequential" : "random"}
                    />
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5 lg:p-6">
                  <h2 className="text-xl font-semibold text-stone-900 lg:text-2xl">
                    {shape.name}
                  </h2>
                  <p className="mt-1 text-sm text-stone-500">
                    {count} {noun}
                  </p>
                  {shape.priceTiers && shape.priceTiers.length > 0 && (
                    <PriceTiersList tiers={shape.priceTiers} />
                  )}
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-medium text-amber-700 transition-colors group-hover:text-amber-900">
                    Персоналізувати
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
