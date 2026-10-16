import type { Product } from "@kisa/shared";
import { Hero } from "@/components/hero/Hero";
import type { HeroData } from "@/components/hero/HeroCta";
import { HowItWorks } from "@/components/home/HowItWorks";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { getProduct, getProducts, load, pickFeatured } from "@/lib/data";

/** The hero's bag: a featured pack, with its milling date from the Quality Passport. */
async function loadHero(products: Product[]): Promise<HeroData | null> {
  const p = pickFeatured(products);
  if (!p) return null;
  const detail = await load(() => getProduct(p.id));
  if (!detail.ok || !detail.data) return null;
  return {
    label: { variety: p.variety.name, weightKg: p.bagSizeKg, batchId: p.batchId },
    riceType: p.riceType,
    millingDate: detail.data.passport.millingDate,
  };
}

export default async function Home() {
  const catalogue = await load(() => getProducts());
  const hero = catalogue.ok ? await loadHero(catalogue.data) : null;

  return (
    <>
      <Hero data={hero} />
      <HowItWorks />
      <FeaturedProducts products={catalogue.ok ? catalogue.data : null} />
    </>
  );
}
