import { categoryList, salesModelInfo } from "@/lib/categories";
import { getFarmer, productsIn } from "@/data/mock";
import { Reveal } from "@/components/ui/Reveal";
import { CategoryCard, type CategoryCardData } from "@/components/home/CategoryCard";
import type { SalesModel } from "@/lib/types";

const MODELS: SalesModel[] = ["FARMER_OWNED", "PARTNER_SOURCED"];

/** "Shop by crop": one large card per category in lib/categories.ts. */
export function CategorySwitcher() {
  const cards: CategoryCardData[] = categoryList.flatMap((c) => {
    const products = productsIn(c.id);
    const hero = products.find((p) => p.featured && p.salesModel === "FARMER_OWNED") ?? products[0];
    if (!hero) return [];
    return [
      {
        href: `/shop/${c.slug}`,
        name: c.name,
        tagline: c.tagline,
        theme: c.theme,
        particle: c.particle,
        count: products.length,
        models: MODELS.flatMap((m) => {
          const n = products.filter((p) => p.salesModel === m).length;
          return n ? [`${n} ${salesModelInfo(m, c.id).label}`] : [];
        }),
        varieties: c.varieties,
        minPrice: Math.min(...products.map((p) => p.price)),
        hero,
        heroFarmer: getFarmer(hero.farmerId)?.name ?? "",
      },
    ];
  });

  return (
    <section id="crops" aria-labelledby="crops-title" className="scroll-mt-20 py-20 sm:py-24">
      <div className="mx-auto max-w-site px-4 sm:px-6">
        <Reveal className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-husk">Shop by crop</p>
          <h2 id="crops-title" className="mt-3 text-3xl font-semibold text-field sm:text-4xl">
            Two crops, one promise
          </h2>
          <p className="mt-4 text-soil/75">
            Every pack names its farmer, shows its price split, and traces back to the field.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {cards.map((data, i) => (
            <Reveal key={data.href} delay={i * 0.1} className="h-full">
              <CategoryCard data={data} index={i} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
