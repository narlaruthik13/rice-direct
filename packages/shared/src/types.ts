// Domain types for Kisa.
// Two sales models per product (see CLAUDE.md):
//   FARMER_OWNED (Model B, toll processing): the farmer owns the produce and pays
//     the partner a processing fee.
//   PARTNER_SOURCED (Model A): the partner buys from the farmer at a published
//     price, processes and sells. The farmer stays visible.
// Categories (rice, onions, ...) are configured in apps/web/lib/categories.ts.

export type CategoryId = "rice" | "onions";
export type SalesModel = "FARMER_OWNED" | "PARTNER_SOURCED";
export type PartnerType = "MILL" | "PACKHOUSE";
export type ProcessStep = "harvest" | "milling" | "curing" | "grading" | "packing";

/** One displayable product attribute, resolved from the product, batch or quality report. */
export interface AttributeDef {
  key: string;
  label: string;
  unit?: string;
  /** Display names for coded values, e.g. { aged: "Aged" }. */
  values?: Record<string, string>;
}

/** A quality measure shown in reports; `limit` = typical upper limit (lower is better). */
export interface QualityMetricDef {
  key: string;
  label: string;
  unit?: string;
  limit?: number;
}

/** A category-specific shop filter, e.g. rice age or onion size. Reads `key` on the product. */
export interface CategoryFilterDef {
  key: string;
  /** URL parameter, e.g. ?age=aged */
  param: string;
  label: string;
  options: { value: string; label: string }[];
}

export interface Category {
  id: CategoryId;
  name: string;
  /** URL segment: /shop/[slug] */
  slug: string;
  tagline: string;
  shopIntro: string;
  /** Category card and accent colours. */
  theme: { bg: string; accent: string };
  filters: CategoryFilterDef[];
  /** What flies into the cart on "Add to cart". */
  particle: { shape: "grain" | "bulb"; colors: string[] };
  /** Words used in copy, e.g. rice: raw "paddy" → product "rice". */
  nouns: { raw: string; product: string; this: string; inLabel: string; outLabel: string; yieldLabel: string };
  /** Which pack illustration to draw, and what it is called in copy. */
  pack: { style: "jute-sack" | "mesh-bag"; noun: string };
  /** The short badge on product cards and pages. */
  badge: { key: string; values: Record<string, string>; tones?: Record<string, "field" | "husk"> };
  /** Optional colour per variety (e.g. onion bulb colour on the pack illustration). */
  varietyColors?: Record<string, string>;
  quality: { limits: QualityMetricDef[]; highlights: QualityMetricDef[] };
  partnerType: PartnerType;
  /** Journey steps in order; drives trace timelines and batch stories. */
  steps: ProcessStep[];
  attributes: AttributeDef[];
  varieties: readonly string[];
  packSizesKg: number[];
  perishable: boolean;
  /** Platform fee charged per kg, for both sales models. */
  platformFeePerKg: number;
}

// ---------- Category-specific values ----------

export type RiceVariety =
  | "Sona Masoori"
  | "BPT 5204"
  | "RNR 15048"
  | "Chittimutyalu"
  | "Jeelakara Sannalu"
  | "Brown Sona Masoori";

/** "new" = sold within ~3 months of milling; "aged" = stored 6+ months (cooks fluffier). */
export type RiceAge = "new" | "aged";

export type OnionVariety = "Nashik Red" | "Bellary" | "Kurnool";
export type OnionSizeGrade = "small" | "medium" | "large";

// ---------- People and partners ----------

export type FarmingMethod = "conventional" | "low-chemical" | "natural";

export interface Farmer {
  id: string;
  name: string;
  village: string;
  district: string;
  state: string;
  acres: number;
  yearsFarming: number;
  method: FarmingMethod;
  story: string;
  /** Path under /public; optional until real photos exist. */
  photo?: string;
}

/** A processing partner: a rice mill or an onion packhouse. */
export interface Partner {
  id: string;
  type: PartnerType;
  name: string;
  town: string;
  district: string;
  state: string;
  /** FARMER_OWNED: fee charged to the farmer per kg of finished produce (₹). */
  processingFeePerKg: number;
  certifications: string[];
  established: number;
}

// ---------- Quality ----------

export interface RiceQuality {
  /** Percentage, e.g. 13.2 */
  moisturePct: number;
  /** Share of broken grains, percentage */
  brokenPct: number;
  /** Foreign matter (stones, husk), percentage */
  foreignMatterPct: number;
  /** Average grain length in mm */
  grainLengthMm: number;
  testedBy: string;
  testedOn: string; // ISO date
  grade: "A" | "A+" | "Premium";
}

/** Kept for existing rice components. */
export type QualityReport = RiceQuality;

export interface OnionQuality {
  avgSizeMm: number;
  /** Bruised, cut or rotting bulbs, percentage */
  damagedPct: number;
  /** Bulbs showing sprouts, percentage */
  sproutedPct: number;
  skin: string;
  pungency: "Mild" | "Medium" | "Strong";
  testedBy: string;
  testedOn: string; // ISO date
  grade: "A" | "A+" | "Premium";
}

// ---------- Batches ----------

/** PARTNER_SOURCED only: when the partner bought the lot, at the published price. */
export interface FarmerPurchase {
  date: string; // ISO date
  /** ₹ per kg of raw produce (category.nouns.raw), e.g. paddy. */
  pricePerKg: number;
}

/** One traceable lot: one farmer's harvest, processed by one partner. */
interface BatchBase {
  id: string; // printed on the pack + QR → /trace/[batchId]
  categoryId: CategoryId;
  /** Who owns this lot while it is processed and sold. */
  salesModel: SalesModel;
  /** Required for PARTNER_SOURCED, absent for FARMER_OWNED (checked in data/mock.ts). */
  purchase?: FarmerPurchase;
  farmerId: string;
  partnerId: string;
  harvestDate: string; // ISO date
  packedDate: string; // ISO date
  /** Raw produce in (paddy, harvested onions), kg. */
  inputKg: number;
  /** Sellable produce out after processing, kg. */
  outputKg: number;
}

export interface RiceBatch extends BatchBase {
  categoryId: "rice";
  variety: RiceVariety;
  millingDate: string; // ISO date
  age: RiceAge;
  quality: RiceQuality;
}

export interface OnionBatch extends BatchBase {
  categoryId: "onions";
  variety: OnionVariety;
  curingDays: number;
  gradingDate: string; // ISO date
  sizeGrade: OnionSizeGrade;
  shelfLifeDays: number;
  quality: OnionQuality;
}

export type Batch = RiceBatch | OnionBatch;

// ---------- Pricing ----------

/** All amounts are ₹ per pack. Customer price = sum of the three parts. */
export interface FarmerOwnedBreakdown {
  model: "FARMER_OWNED";
  farmerShare: number;
  processingFee: number;
  platformFee: number;
}

export interface PartnerSourcedBreakdown {
  model: "PARTNER_SOURCED";
  paidToFarmer: number;
  partnerMargin: number;
  platformFee: number;
}

export type PriceBreakdown = FarmerOwnedBreakdown | PartnerSourcedBreakdown;

// ---------- Products ----------

interface ProductBase {
  id: string;
  name: string;
  categoryId: CategoryId;
  salesModel: SalesModel;
  batchId: string;
  farmerId: string;
  partnerId: string;
  /** Pack size; must be one of the category's packSizesKg. */
  bagSizeKg: number;
  priceBreakdown: PriceBreakdown;
  /** Always equals the sum of the price breakdown. */
  price: number;
  description: string;
  tags: string[];
  inStock: boolean;
  featured: boolean;
}

export interface RiceProduct extends ProductBase {
  categoryId: "rice";
  variety: RiceVariety;
  age: RiceAge;
}

export interface OnionProduct extends ProductBase {
  categoryId: "onions";
  variety: OnionVariety;
  sizeGrade: OnionSizeGrade;
  shelfLifeDays: number;
}

export type Product = RiceProduct | OnionProduct;

export interface CartItem {
  productId: string;
  quantity: number;
}
