// Database rows → the shapes in @kisa/shared that the website already uses.
// Paise become rupees, dates become YYYY-MM-DD, enums use the website's spellings,
// and product ids are the slugs used in website URLs.
import type {
  Batch as DbBatch,
  Category as DbCategory,
  Farmer as DbFarmer,
  FarmingMethod,
  Partner as DbPartner,
  Product as DbProduct,
} from "@kisa/db";
import type {
  Batch,
  CategoryId,
  CategorySummary,
  Farmer,
  OnionProduct,
  Partner,
  PriceBreakdown,
  Product,
  RiceProduct,
} from "@kisa/shared";

const rupees = (paise: number) => paise / 100;
const isoDate = (d: Date) => d.toISOString().slice(0, 10);

const METHOD: Record<FarmingMethod, Farmer["method"]> = {
  CONVENTIONAL: "conventional",
  LOW_CHEMICAL: "low-chemical",
  NATURAL: "natural",
};

type Attributes = Record<string, unknown>;
const attrs = (b: DbBatch) => (b.attributes ?? {}) as Attributes;

export const toCategory = (c: DbCategory): CategorySummary => ({
  id: c.id as CategoryId,
  name: c.name,
  slug: c.slug,
  partnerType: c.partnerType,
  perishable: c.perishable,
  platformFeePerKg: rupees(c.platformFeePerKgPaise),
  packSizesKg: c.packSizesKg,
});

export const toFarmer = (f: DbFarmer): Farmer => ({
  id: f.id,
  name: f.name,
  village: f.village,
  district: f.district,
  state: f.state,
  acres: f.acres,
  yearsFarming: f.yearsFarming,
  method: METHOD[f.method],
  story: f.story,
  ...(f.photoUrl ? { photo: f.photoUrl } : {}),
});

export const toPartner = (p: DbPartner): Partner => ({
  id: p.id,
  type: p.type,
  name: p.name,
  town: p.town,
  district: p.district,
  state: p.state,
  processingFeePerKg: rupees(p.processingFeePerKgPaise),
  certifications: p.certifications,
  established: p.established,
});

export const toBatch = (b: DbBatch): Batch =>
  ({
    id: b.id,
    categoryId: b.categoryId,
    salesModel: b.salesModel,
    ...(b.purchaseDate && b.purchasePricePerKgPaise !== null
      ? { purchase: { date: isoDate(b.purchaseDate), pricePerKg: rupees(b.purchasePricePerKgPaise) } }
      : {}),
    farmerId: b.farmerId,
    partnerId: b.partnerId,
    variety: b.variety,
    harvestDate: isoDate(b.harvestDate),
    packedDate: isoDate(b.packedDate),
    inputKg: b.inputKg,
    outputKg: b.outputKg,
    ...attrs(b), // crop-specific: rice { millingDate, age }, onions { curingDays, gradingDate, sizeGrade }
    ...(b.shelfLifeDays !== null ? { shelfLifeDays: b.shelfLifeDays } : {}),
    quality: b.quality,
  }) as unknown as Batch;

const toBreakdown = (p: DbProduct, b: DbBatch): PriceBreakdown =>
  b.salesModel === "FARMER_OWNED"
    ? {
        model: "FARMER_OWNED",
        farmerShare: rupees(p.farmerSharePaise),
        processingFee: rupees(p.partnerSharePaise),
        platformFee: rupees(p.platformFeePaise),
      }
    : {
        model: "PARTNER_SOURCED",
        paidToFarmer: rupees(p.farmerSharePaise),
        partnerMargin: rupees(p.partnerSharePaise),
        platformFee: rupees(p.platformFeePaise),
      };

/** In stock = active and the batch has enough kg left for one pack. */
export const isInStock = (p: DbProduct, b: DbBatch) => p.isActive && b.availableKg >= p.bagSizeKg;

export function toProduct(p: DbProduct, b: DbBatch): Product {
  const base = {
    id: p.slug,
    name: p.name,
    salesModel: b.salesModel,
    batchId: b.id,
    farmerId: b.farmerId,
    partnerId: b.partnerId,
    bagSizeKg: p.bagSizeKg,
    priceBreakdown: toBreakdown(p, b),
    price: rupees(p.pricePaise),
    description: p.description,
    tags: p.tags,
    inStock: isInStock(p, b),
    featured: p.featured,
  };
  const a = attrs(b);
  if (b.categoryId === "onions") {
    return {
      ...base,
      categoryId: "onions",
      variety: b.variety,
      sizeGrade: a.sizeGrade,
      shelfLifeDays: b.shelfLifeDays,
    } as OnionProduct;
  }
  return { ...base, categoryId: "rice", variety: b.variety, age: a.age } as RiceProduct;
}
