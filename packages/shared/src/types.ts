// Domain types for Kisa, a rice-only brand: partner mills pack rice in Kisa bags and
// Kisa sells it to customers (mill → Kisa → customer). See CLAUDE.md "Business model".
//
// Public shapes (Product, QualityPassport) never carry the mill or the price split:
// customers see one total price. Admin shapes live in ./api.ts.

/** A product line. Only "rice" today; dal or millets can be added later. */
export type CategoryId = string;

export type RiceType = "RAW" | "STEAM" | "BOILED";
/** NEW = sold within a few months of milling; AGED = stored 6+ months (cooks fluffier). */
export type RiceAge = "NEW" | "AGED";

/** Rice batch attributes (Batch.attributes in the database). */
export interface RiceAttributes {
  riceType: RiceType;
  age: RiceAge;
}

/** Rice quality report, shown on the Quality Passport. */
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

export interface Variety {
  id: string;
  name: string;
  slug: string;
  categoryId: CategoryId;
}

/** A pack as customers see it: variety + type + age + pack size, and one total price. */
export interface Product {
  /** URL slug: /product/[id] */
  id: string;
  name: string;
  categoryId: CategoryId;
  variety: { name: string; slug: string };
  riceType: RiceType;
  age: RiceAge;
  bagSizeKg: number;
  /** ₹ per pack, the only price customers see. */
  price: number;
  description: string;
  tags: string[];
  inStock: boolean;
  featured: boolean;
  /** Printed on the bag; opens the Quality Passport. */
  batchId: string;
}

/** What a bag's QR code opens: the batch's quality facts. No mill, no farmer. */
export interface QualityPassport {
  batchId: string;
  categoryId: CategoryId;
  variety: { name: string; slug: string };
  riceType: RiceType;
  age: RiceAge;
  millingDate: string; // ISO date
  packedDate: string; // ISO date
  bestBefore: string; // ISO date
  quality: RiceQuality;
}

export interface CartItem {
  productId: string;
  quantity: number;
}
