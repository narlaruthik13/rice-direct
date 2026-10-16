// Database rows → the PUBLIC shapes in @kisa/shared. Paise become rupees and dates
// become YYYY-MM-DD. These mappers are the privacy boundary: they never copy the mill,
// the mill price or the Kisa margin. Every public field is listed explicitly (no spreads
// of database rows), so a new column can't leak by accident.
import type { Batch as DbBatch, Category as DbCategory, Product as DbProduct, Variety as DbVariety } from "@kisa/db";
import type { CategorySummary, Product, QualityPassport, RiceAge, RiceQuality, RiceType, Variety } from "@kisa/shared";

const rupees = (paise: number) => paise / 100;
export const isoDate = (d: Date) => d.toISOString().slice(0, 10);

type BatchWithVariety = DbBatch & { variety: Pick<DbVariety, "name" | "slug"> };

const attr = (b: DbBatch) => (b.attributes ?? {}) as { riceType?: RiceType; age?: RiceAge };

export const toCategory = (c: DbCategory): CategorySummary => ({
  id: c.id,
  name: c.name,
  slug: c.slug,
  packSizesKg: c.packSizesKg,
  shelfLifeDays: c.shelfLifeDays,
});

export const toVariety = (v: DbVariety): Variety => ({ id: v.id, name: v.name, slug: v.slug, categoryId: v.categoryId });

/** In stock = active and the batch has enough kg left for one pack. */
export const isInStock = (p: DbProduct, b: DbBatch) => p.isActive && b.availableKg >= p.bagSizeKg;

export function toProduct(p: DbProduct, b: BatchWithVariety): Product {
  const a = attr(b);
  return {
    id: p.slug,
    name: p.name,
    categoryId: b.categoryId,
    variety: { name: b.variety.name, slug: b.variety.slug },
    riceType: a.riceType as RiceType,
    age: a.age as RiceAge,
    bagSizeKg: p.bagSizeKg,
    price: rupees(p.pricePaise),
    description: p.description,
    tags: p.tags,
    inStock: isInStock(p, b),
    featured: p.featured,
    batchId: b.id,
  };
}

const q = (b: DbBatch) => (b.quality ?? {}) as Partial<RiceQuality>;

export function toPassport(b: BatchWithVariety): QualityPassport {
  const a = attr(b);
  const quality = q(b);
  return {
    batchId: b.id,
    categoryId: b.categoryId,
    variety: { name: b.variety.name, slug: b.variety.slug },
    riceType: a.riceType as RiceType,
    age: a.age as RiceAge,
    millingDate: isoDate(b.millingDate),
    packedDate: isoDate(b.packedDate),
    bestBefore: isoDate(b.bestBefore),
    quality: {
      moisturePct: quality.moisturePct!,
      brokenPct: quality.brokenPct!,
      foreignMatterPct: quality.foreignMatterPct!,
      grainLengthMm: quality.grainLengthMm!,
      testedBy: quality.testedBy!,
      testedOn: quality.testedOn!,
      grade: quality.grade!,
    },
  };
}
