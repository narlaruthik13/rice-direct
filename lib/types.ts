// Domain types for Vari Direct (Model B: toll milling).
// The farmer owns the paddy and the rice; the mill is a paid service partner.

export type RiceVariety =
  | "Sona Masoori"
  | "BPT 5204"
  | "RNR 15048"
  | "Chittimutyalu"
  | "Jeelakara Sannalu"
  | "Brown Sona Masoori";

/** "new" = sold within ~3 months of milling; "aged" = stored 6+ months (cooks fluffier). */
export type RiceAge = "new" | "aged";

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

export interface Mill {
  id: string;
  name: string;
  town: string;
  district: string;
  state: string;
  /** Fee the mill charges the farmer per kg of finished rice (₹). */
  millingFeePerKg: number;
  certifications: string[];
  established: number;
}

export interface QualityReport {
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

/** One traceable lot: one farmer's paddy, milled at one mill, on one date. */
export interface Batch {
  id: string; // printed on the bag + QR → /trace/[batchId]
  farmerId: string;
  millId: string;
  variety: RiceVariety;
  harvestDate: string; // ISO date
  millingDate: string; // ISO date
  age: RiceAge;
  paddyKg: number;
  riceKg: number; // output after milling
  quality: QualityReport;
}

/** All amounts are ₹ per bag. Customer price = sum of the three parts. */
export interface PriceBreakdown {
  farmerShare: number;
  millingFee: number;
  platformFee: number;
}

export interface Product {
  id: string;
  name: string;
  batchId: string;
  farmerId: string;
  millId: string;
  variety: RiceVariety;
  age: RiceAge;
  bagSizeKg: number;
  priceBreakdown: PriceBreakdown;
  /** Always equals farmerShare + millingFee + platformFee. */
  price: number;
  description: string;
  tags: string[];
  inStock: boolean;
  featured: boolean;
}

export interface CartItem {
  productId: string;
  quantity: number;
}
