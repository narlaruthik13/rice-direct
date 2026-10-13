// Phase 1 mock data. Replaced by API calls in Phase 2.
// All people and mills here are fictional.

import type { Batch, Farmer, Mill, Product, RiceAge, RiceVariety } from "@/lib/types";

export const farmers: Farmer[] = [
  {
    id: "farmer-ramana",
    name: "Venkata Ramana",
    village: "Pedapudi",
    district: "Kakinada",
    state: "Andhra Pradesh",
    acres: 6,
    yearsFarming: 22,
    method: "low-chemical",
    story:
      "Ramana grows paddy on the same Godavari delta fields his grandfather worked. He switched to low-chemical farming in 2019 and now sells every bag under his own name.",
  },
  {
    id: "farmer-lakshmi",
    name: "Lakshmi Devi",
    village: "Mallial",
    district: "Jagtial",
    state: "Telangana",
    acres: 4,
    yearsFarming: 15,
    method: "natural",
    story:
      "Lakshmi runs her farm with jeevamrutham and cow-dung compost, no synthetic pesticides. She is known in her village for clean, low-broken Telangana Sona.",
  },
  {
    id: "farmer-srinivas",
    name: "Srinivas Rao",
    village: "Vemuru",
    district: "Bapatla",
    state: "Andhra Pradesh",
    acres: 9,
    yearsFarming: 30,
    method: "conventional",
    story:
      "With three decades in the Krishna delta, Srinivas stores part of every harvest for 6 to 12 months so his BPT and Jeelakara rice cook soft and separate.",
  },
];

export const mills: Mill[] = [
  {
    id: "mill-godavari",
    name: "Sri Godavari Rice Mill",
    town: "Mandapeta",
    district: "Konaseema",
    state: "Andhra Pradesh",
    millingFeePerKg: 4,
    certifications: ["FSSAI Licensed", "Sortex Colour Sorting"],
    established: 1998,
  },
  {
    id: "mill-kakatiya",
    name: "Kakatiya Agro Mill",
    town: "Karimnagar",
    district: "Karimnagar",
    state: "Telangana",
    millingFeePerKg: 5,
    certifications: ["FSSAI Licensed", "ISO 22000"],
    established: 2009,
  },
];

export const batches: Batch[] = [
  {
    id: "VD-2026-0412-SM",
    farmerId: "farmer-ramana",
    millId: "mill-godavari",
    variety: "Sona Masoori",
    harvestDate: "2025-11-20",
    millingDate: "2026-04-12",
    age: "aged",
    paddyKg: 4200,
    riceKg: 2730,
    quality: {
      moisturePct: 12.4,
      brokenPct: 2.1,
      foreignMatterPct: 0.1,
      grainLengthMm: 5.2,
      testedBy: "In-house lab, Sri Godavari Rice Mill",
      testedOn: "2026-04-13",
      grade: "A+",
    },
  },
  {
    id: "VD-2026-0820-CM",
    farmerId: "farmer-ramana",
    millId: "mill-godavari",
    variety: "Chittimutyalu",
    harvestDate: "2026-04-15",
    millingDate: "2026-08-20",
    age: "new",
    paddyKg: 1500,
    riceKg: 960,
    quality: {
      moisturePct: 13.1,
      brokenPct: 1.6,
      foreignMatterPct: 0.1,
      grainLengthMm: 4.1,
      testedBy: "In-house lab, Sri Godavari Rice Mill",
      testedOn: "2026-08-21",
      grade: "Premium",
    },
  },
  {
    id: "VD-2026-0805-TS",
    farmerId: "farmer-lakshmi",
    millId: "mill-kakatiya",
    variety: "RNR 15048",
    harvestDate: "2026-04-25",
    millingDate: "2026-08-05",
    age: "new",
    paddyKg: 2800,
    riceKg: 1850,
    quality: {
      moisturePct: 13.0,
      brokenPct: 1.8,
      foreignMatterPct: 0.05,
      grainLengthMm: 5.0,
      testedBy: "Karimnagar Agri Quality Lab",
      testedOn: "2026-08-07",
      grade: "A+",
    },
  },
  {
    id: "VD-2026-0901-BR",
    farmerId: "farmer-lakshmi",
    millId: "mill-kakatiya",
    variety: "Brown Sona Masoori",
    harvestDate: "2026-04-25",
    millingDate: "2026-09-01",
    age: "new",
    paddyKg: 900,
    riceKg: 680,
    quality: {
      moisturePct: 12.8,
      brokenPct: 3.0,
      foreignMatterPct: 0.1,
      grainLengthMm: 5.1,
      testedBy: "Karimnagar Agri Quality Lab",
      testedOn: "2026-09-02",
      grade: "A",
    },
  },
  {
    id: "VD-2026-0315-BP",
    farmerId: "farmer-srinivas",
    millId: "mill-godavari",
    variety: "BPT 5204",
    harvestDate: "2025-12-05",
    millingDate: "2026-03-15",
    age: "aged",
    paddyKg: 6500,
    riceKg: 4300,
    quality: {
      moisturePct: 12.2,
      brokenPct: 2.5,
      foreignMatterPct: 0.1,
      grainLengthMm: 5.0,
      testedBy: "In-house lab, Sri Godavari Rice Mill",
      testedOn: "2026-03-16",
      grade: "A",
    },
  },
  {
    id: "VD-2026-0220-JS",
    farmerId: "farmer-srinivas",
    millId: "mill-kakatiya",
    variety: "Jeelakara Sannalu",
    harvestDate: "2025-11-28",
    millingDate: "2026-02-20",
    age: "aged",
    paddyKg: 1200,
    riceKg: 780,
    quality: {
      moisturePct: 12.0,
      brokenPct: 1.9,
      foreignMatterPct: 0.05,
      grainLengthMm: 3.9,
      testedBy: "Karimnagar Agri Quality Lab",
      testedOn: "2026-02-22",
      grade: "Premium",
    },
  },
];

/** Flat platform fee per kg (₹). */
const PLATFORM_FEE_PER_KG = 3;

interface ProductInput {
  id: string;
  name: string;
  batchId: string;
  bagSizeKg: number;
  /** ₹ the farmer receives per kg. */
  farmerSharePerKg: number;
  description: string;
  tags: string[];
  inStock?: boolean;
  featured?: boolean;
}

// Builds a Product from its batch so farmer/mill/variety/age never drift,
// and price is always the exact sum of the breakdown.
function makeProduct(input: ProductInput): Product {
  const batch = batches.find((b) => b.id === input.batchId);
  if (!batch) throw new Error(`Unknown batch ${input.batchId}`);
  const mill = mills.find((m) => m.id === batch.millId);
  if (!mill) throw new Error(`Unknown mill ${batch.millId}`);

  const priceBreakdown = {
    farmerShare: input.farmerSharePerKg * input.bagSizeKg,
    millingFee: mill.millingFeePerKg * input.bagSizeKg,
    platformFee: PLATFORM_FEE_PER_KG * input.bagSizeKg,
  };

  return {
    id: input.id,
    name: input.name,
    batchId: batch.id,
    farmerId: batch.farmerId,
    millId: batch.millId,
    variety: batch.variety,
    age: batch.age,
    bagSizeKg: input.bagSizeKg,
    priceBreakdown,
    price: priceBreakdown.farmerShare + priceBreakdown.millingFee + priceBreakdown.platformFee,
    description: input.description,
    tags: input.tags,
    inStock: input.inStock ?? true,
    featured: input.featured ?? false,
  };
}

export const products: Product[] = [
  makeProduct({
    id: "aged-sona-masoori-10kg",
    name: "Aged Sona Masoori",
    batchId: "VD-2026-0412-SM",
    bagSizeKg: 10,
    farmerSharePerKg: 62,
    description:
      "Six months of careful storage gives this Godavari delta Sona Masoori a light, fluffy cook. An everyday rice for meals and pulihora.",
    tags: ["Everyday", "Low-chemical", "Aged 6 months"],
    featured: true,
  }),
  makeProduct({
    id: "chittimutyalu-5kg",
    name: "Chittimutyalu",
    batchId: "VD-2026-0820-CM",
    bagSizeKg: 5,
    farmerSharePerKg: 85,
    description:
      "Short, pearl-like aromatic grains, the classic choice for biryani and pulao in coastal Andhra kitchens.",
    tags: ["Aromatic", "Biryani", "Low-chemical"],
    featured: true,
  }),
  makeProduct({
    id: "telangana-sona-10kg",
    name: "Telangana Sona (RNR 15048)",
    batchId: "VD-2026-0805-TS",
    bagSizeKg: 10,
    farmerSharePerKg: 56,
    description:
      "A low glycaemic index variety from PJTSAU, grown naturally by Lakshmi Devi. Soft, slender grains suited to daily meals.",
    tags: ["Low GI", "Natural farming", "New crop"],
    featured: true,
  }),
  makeProduct({
    id: "brown-sona-masoori-5kg",
    name: "Brown Sona Masoori",
    batchId: "VD-2026-0901-BR",
    bagSizeKg: 5,
    farmerSharePerKg: 72,
    description:
      "Only the husk is removed, so the bran layer stays on. Nutty, high in fibre, and grown with natural farming.",
    tags: ["Brown rice", "High fibre", "Natural farming"],
  }),
  makeProduct({
    id: "aged-bpt-5204-25kg",
    name: "Aged BPT 5204",
    batchId: "VD-2026-0315-BP",
    bagSizeKg: 25,
    farmerSharePerKg: 60,
    description:
      "The family-size bag. Krishna delta Samba Masuri, aged seven months so it cooks into separate, non-sticky grains.",
    tags: ["Family pack", "Aged 7 months", "Everyday"],
    featured: true,
  }),
  makeProduct({
    id: "jeelakara-sannalu-5kg",
    name: "Aged Jeelakara Sannalu",
    batchId: "VD-2026-0220-JS",
    bagSizeKg: 5,
    farmerSharePerKg: 82,
    description:
      "Tiny cumin-shaped grains with a delicate aroma, aged for eight months. Small batch, ideal for festive cooking.",
    tags: ["Aromatic", "Small batch", "Aged 8 months"],
    inStock: false,
  }),
];

// Lookup helpers. Pages use these so swapping to APIs in Phase 2 is one place.
export const getFarmer = (id: string) => farmers.find((f) => f.id === id);
export const getMill = (id: string) => mills.find((m) => m.id === id);
export const getBatch = (id: string) => batches.find((b) => b.id === id);
export const getProduct = (id: string) => products.find((p) => p.id === id);

export const varieties: RiceVariety[] = Array.from(new Set(products.map((p) => p.variety)));
export const ageOptions: RiceAge[] = ["new", "aged"];
