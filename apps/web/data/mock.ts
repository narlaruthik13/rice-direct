// Phase 1 / 1.5 mock data. Replaced by API calls in Phase 2.
// All people, mills and packhouses here are fictional.
//
// Rice and onions, each in both sales models:
//   FARMER_OWNED (Model B): farmer owns the lot and pays the partner a processing fee.
//   PARTNER_SOURCED (Model A): partner buys from the farmer at a published price.

import type {
  Batch,
  CategoryId,
  Farmer,
  OnionBatch,
  OnionProduct,
  Partner,
  PriceBreakdown,
  Product,
  RiceBatch,
  RiceProduct,
} from "@kisa/shared";
import { categories } from "@/lib/categories";
import { priceTotal } from "@/lib/pricing";

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
  {
    id: "farmer-shankar",
    name: "Shankar Pawar",
    village: "Lasalgaon",
    district: "Nashik",
    state: "Maharashtra",
    acres: 5,
    yearsFarming: 18,
    method: "low-chemical",
    story:
      "Shankar grows Nashik Red in two seasons near Asia's biggest onion market. Field-curing every harvest under its own leaves keeps the skins tight and the bulbs firm for months.",
  },
  {
    id: "farmer-mallikarjuna",
    name: "Mallikarjuna Gowda",
    village: "Siruguppa",
    district: "Ballari",
    state: "Karnataka",
    acres: 7,
    yearsFarming: 24,
    method: "conventional",
    story:
      "On black-soil fields beside the Tungabhadra, Mallikarjuna grows the large, light-skinned Bellary onion that kitchens across South India rely on.",
  },
  {
    id: "farmer-venkatesh",
    name: "Venkatesh Naidu",
    village: "Pattikonda",
    district: "Kurnool",
    state: "Andhra Pradesh",
    acres: 3,
    yearsFarming: 12,
    method: "natural",
    story:
      "Venkatesh farms with drip irrigation and no synthetic sprays. The small, pungent Kurnool onions from this farm are prized for pickles and chutneys.",
  },
];

export const partners: Partner[] = [
  {
    id: "mill-godavari",
    type: "MILL",
    name: "Sri Godavari Rice Mill",
    town: "Mandapeta",
    district: "Konaseema",
    state: "Andhra Pradesh",
    processingFeePerKg: 4,
    certifications: ["FSSAI Licensed", "Sortex Colour Sorting"],
    established: 1998,
  },
  {
    id: "mill-kakatiya",
    type: "MILL",
    name: "Kakatiya Agro Mill",
    town: "Karimnagar",
    district: "Karimnagar",
    state: "Telangana",
    processingFeePerKg: 5,
    certifications: ["FSSAI Licensed", "ISO 22000"],
    established: 2009,
  },
  {
    id: "packhouse-lasalgaon",
    type: "PACKHOUSE",
    name: "Lasalgaon Onion Packhouse",
    town: "Lasalgaon",
    district: "Nashik",
    state: "Maharashtra",
    processingFeePerKg: 3,
    certifications: ["FSSAI Licensed", "Ventilated curing sheds"],
    established: 2012,
  },
  {
    id: "packhouse-kurnool",
    type: "PACKHOUSE",
    name: "Kurnool Agri Packhouse",
    town: "Kurnool",
    district: "Kurnool",
    state: "Andhra Pradesh",
    processingFeePerKg: 2,
    certifications: ["FSSAI Licensed", "Mechanical size grading"],
    established: 2016,
  },
];

const riceBatchList: RiceBatch[] = [
  {
    id: "KS-2026-0412-SM",
    categoryId: "rice",
    salesModel: "FARMER_OWNED",
    farmerId: "farmer-ramana",
    partnerId: "mill-godavari",
    variety: "Sona Masoori",
    harvestDate: "2025-11-20",
    millingDate: "2026-04-12",
    packedDate: "2026-10-06",
    age: "aged",
    inputKg: 4200,
    outputKg: 2730,
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
    id: "KS-2026-0820-CM",
    categoryId: "rice",
    salesModel: "FARMER_OWNED",
    farmerId: "farmer-ramana",
    partnerId: "mill-godavari",
    variety: "Chittimutyalu",
    harvestDate: "2026-04-15",
    millingDate: "2026-08-20",
    packedDate: "2026-08-22",
    age: "new",
    inputKg: 1500,
    outputKg: 960,
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
    id: "KS-2026-0805-TS",
    categoryId: "rice",
    salesModel: "FARMER_OWNED",
    farmerId: "farmer-lakshmi",
    partnerId: "mill-kakatiya",
    variety: "RNR 15048",
    harvestDate: "2026-04-25",
    millingDate: "2026-08-05",
    packedDate: "2026-08-07",
    age: "new",
    inputKg: 2800,
    outputKg: 1850,
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
    id: "KS-2026-0901-BR",
    categoryId: "rice",
    salesModel: "FARMER_OWNED",
    farmerId: "farmer-lakshmi",
    partnerId: "mill-kakatiya",
    variety: "Brown Sona Masoori",
    harvestDate: "2026-04-25",
    millingDate: "2026-09-01",
    packedDate: "2026-09-03",
    age: "new",
    inputKg: 900,
    outputKg: 680,
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
    id: "KS-2026-0315-BP",
    categoryId: "rice",
    salesModel: "FARMER_OWNED",
    farmerId: "farmer-srinivas",
    partnerId: "mill-godavari",
    variety: "BPT 5204",
    harvestDate: "2025-12-05",
    millingDate: "2026-03-15",
    packedDate: "2026-10-02",
    age: "aged",
    inputKg: 6500,
    outputKg: 4300,
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
    id: "KS-2026-0220-JS",
    categoryId: "rice",
    salesModel: "FARMER_OWNED",
    farmerId: "farmer-srinivas",
    partnerId: "mill-kakatiya",
    variety: "Jeelakara Sannalu",
    harvestDate: "2025-11-28",
    millingDate: "2026-02-20",
    packedDate: "2026-09-25",
    age: "aged",
    inputKg: 1200,
    outputKg: 780,
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
  // ----- PARTNER_SOURCED rice: the mill bought this paddy at a published price -----
  {
    id: "KS-2026-0910-SP",
    categoryId: "rice",
    salesModel: "PARTNER_SOURCED",
    purchase: { date: "2026-04-27", pricePerKg: 34 },
    farmerId: "farmer-srinivas",
    partnerId: "mill-godavari",
    variety: "Sona Masoori",
    harvestDate: "2026-04-20",
    millingDate: "2026-09-10",
    packedDate: "2026-09-12",
    age: "new",
    inputKg: 8000,
    outputKg: 5250,
    quality: {
      moisturePct: 13.2,
      brokenPct: 3.4,
      foreignMatterPct: 0.1,
      grainLengthMm: 5.1,
      testedBy: "In-house lab, Sri Godavari Rice Mill",
      testedOn: "2026-09-11",
      grade: "A",
    },
  },
  {
    id: "KS-2026-0618-BA",
    categoryId: "rice",
    salesModel: "PARTNER_SOURCED",
    purchase: { date: "2025-12-16", pricePerKg: 33 },
    farmerId: "farmer-ramana",
    partnerId: "mill-godavari",
    variety: "BPT 5204",
    harvestDate: "2025-12-10",
    millingDate: "2026-06-18",
    packedDate: "2026-10-04",
    age: "aged",
    inputKg: 3000,
    outputKg: 1960,
    quality: {
      moisturePct: 12.3,
      brokenPct: 2.8,
      foreignMatterPct: 0.1,
      grainLengthMm: 5.0,
      testedBy: "In-house lab, Sri Godavari Rice Mill",
      testedOn: "2026-06-19",
      grade: "A",
    },
  },
  {
    id: "KS-2026-0828-TP",
    categoryId: "rice",
    salesModel: "PARTNER_SOURCED",
    purchase: { date: "2026-05-02", pricePerKg: 36 },
    farmerId: "farmer-lakshmi",
    partnerId: "mill-kakatiya",
    variety: "RNR 15048",
    harvestDate: "2026-04-25",
    millingDate: "2026-08-28",
    packedDate: "2026-08-30",
    age: "new",
    inputKg: 2200,
    outputKg: 1440,
    quality: {
      moisturePct: 13.1,
      brokenPct: 2.2,
      foreignMatterPct: 0.05,
      grainLengthMm: 5.0,
      testedBy: "Karimnagar Agri Quality Lab",
      testedOn: "2026-08-30",
      grade: "A+",
    },
  },
];

const onionBatchList: OnionBatch[] = [
  // ----- FARMER_OWNED onions: the packhouse cures, grades and packs for a fee -----
  {
    id: "KS-2026-1005-NR",
    categoryId: "onions",
    salesModel: "FARMER_OWNED",
    farmerId: "farmer-shankar",
    partnerId: "packhouse-lasalgaon",
    variety: "Nashik Red",
    harvestDate: "2026-09-18",
    curingDays: 12,
    gradingDate: "2026-10-02",
    packedDate: "2026-10-05",
    inputKg: 6000,
    outputKg: 5100,
    sizeGrade: "large",
    shelfLifeDays: 45,
    quality: {
      avgSizeMm: 68,
      damagedPct: 1.2,
      sproutedPct: 0,
      skin: "Dry, tight, deep red",
      pungency: "Medium",
      testedBy: "Lasalgaon Onion Packhouse QC",
      testedOn: "2026-10-03",
      grade: "A+",
    },
  },
  {
    id: "KS-2026-1008-BL",
    categoryId: "onions",
    salesModel: "FARMER_OWNED",
    farmerId: "farmer-mallikarjuna",
    partnerId: "packhouse-kurnool",
    variety: "Bellary",
    harvestDate: "2026-09-25",
    curingDays: 10,
    gradingDate: "2026-10-07",
    packedDate: "2026-10-08",
    inputKg: 9000,
    outputKg: 7800,
    sizeGrade: "medium",
    shelfLifeDays: 30,
    quality: {
      avgSizeMm: 60,
      damagedPct: 1.8,
      sproutedPct: 0,
      skin: "Dry, light pink",
      pungency: "Mild",
      testedBy: "Kurnool Agri Packhouse QC",
      testedOn: "2026-10-07",
      grade: "A",
    },
  },
  {
    id: "KS-2026-1001-KN",
    categoryId: "onions",
    salesModel: "FARMER_OWNED",
    farmerId: "farmer-venkatesh",
    partnerId: "packhouse-kurnool",
    variety: "Kurnool",
    harvestDate: "2026-09-12",
    curingDays: 14,
    gradingDate: "2026-09-28",
    packedDate: "2026-10-01",
    inputKg: 2400,
    outputKg: 2050,
    sizeGrade: "small",
    shelfLifeDays: 40,
    quality: {
      avgSizeMm: 48,
      damagedPct: 0.9,
      sproutedPct: 0,
      skin: "Dry, tight, dark red",
      pungency: "Strong",
      testedBy: "Kurnool Agri Packhouse QC",
      testedOn: "2026-09-29",
      grade: "Premium",
    },
  },
  // ----- PARTNER_SOURCED onions: the packhouse bought these at a published price -----
  {
    id: "KS-2026-1003-NS",
    categoryId: "onions",
    salesModel: "PARTNER_SOURCED",
    purchase: { date: "2026-04-14", pricePerKg: 17 },
    farmerId: "farmer-shankar",
    partnerId: "packhouse-lasalgaon",
    variety: "Nashik Red",
    harvestDate: "2026-04-10",
    curingDays: 15,
    gradingDate: "2026-04-28",
    packedDate: "2026-10-03",
    inputKg: 12000,
    outputKg: 9600,
    sizeGrade: "medium",
    shelfLifeDays: 30,
    quality: {
      avgSizeMm: 58,
      damagedPct: 2.1,
      sproutedPct: 0.5,
      skin: "Dry, firm, red",
      pungency: "Medium",
      testedBy: "Lasalgaon Onion Packhouse QC",
      testedOn: "2026-10-02",
      grade: "A",
    },
  },
  {
    id: "KS-2026-1009-BP",
    categoryId: "onions",
    salesModel: "PARTNER_SOURCED",
    purchase: { date: "2026-09-27", pricePerKg: 20 },
    farmerId: "farmer-mallikarjuna",
    partnerId: "packhouse-kurnool",
    variety: "Bellary",
    harvestDate: "2026-09-25",
    curingDays: 10,
    gradingDate: "2026-10-07",
    packedDate: "2026-10-09",
    inputKg: 5000,
    outputKg: 4300,
    sizeGrade: "large",
    shelfLifeDays: 30,
    quality: {
      avgSizeMm: 70,
      damagedPct: 1.5,
      sproutedPct: 0,
      skin: "Dry, light pink",
      pungency: "Mild",
      testedBy: "Kurnool Agri Packhouse QC",
      testedOn: "2026-10-08",
      grade: "A+",
    },
  },
  {
    id: "KS-2026-1002-KP",
    categoryId: "onions",
    salesModel: "PARTNER_SOURCED",
    purchase: { date: "2026-09-14", pricePerKg: 19 },
    farmerId: "farmer-venkatesh",
    partnerId: "packhouse-kurnool",
    variety: "Kurnool",
    harvestDate: "2026-09-12",
    curingDays: 14,
    gradingDate: "2026-09-28",
    packedDate: "2026-10-02",
    inputKg: 3000,
    outputKg: 2580,
    sizeGrade: "medium",
    shelfLifeDays: 35,
    quality: {
      avgSizeMm: 56,
      damagedPct: 1.1,
      sproutedPct: 0,
      skin: "Dry, dark red",
      pungency: "Strong",
      testedBy: "Kurnool Agri Packhouse QC",
      testedOn: "2026-09-30",
      grade: "A",
    },
  },
];

export const batches: Batch[] = [...riceBatchList, ...onionBatchList];

interface ProductInput {
  id: string;
  name: string;
  batchId: string;
  bagSizeKg: number;
  /**
   * FARMER_OWNED only: ₹ per kg of packed produce the farmer keeps.
   * (PARTNER_SOURCED uses the batch's purchase price instead.)
   */
  farmerPricePerKg?: number;
  /** PARTNER_SOURCED only: the partner's margin per kg (covers processing). */
  partnerMarginPerKg?: number;
  description: string;
  tags: string[];
  inStock?: boolean;
  featured?: boolean;
}

// Builds a Product from its batch so category, sales model, farmer, partner and
// variety never drift, and price is always the exact sum of the breakdown.
function makeProduct(input: ProductInput): Product {
  const batch = batches.find((b) => b.id === input.batchId);
  if (!batch) throw new Error(`Unknown batch ${input.batchId}`);
  const partner = partners.find((p) => p.id === batch.partnerId);
  if (!partner) throw new Error(`Unknown partner ${batch.partnerId}`);
  const category = categories[batch.categoryId];
  if (partner.type !== category.partnerType) {
    throw new Error(`${partner.id} is a ${partner.type}, but ${category.name} needs a ${category.partnerType}`);
  }
  if (!category.packSizesKg.includes(input.bagSizeKg)) {
    throw new Error(`${input.id}: ${input.bagSizeKg} kg is not a ${category.name} pack size`);
  }

  const kg = input.bagSizeKg;
  const platformFee = category.platformFeePerKg * kg;
  let priceBreakdown: PriceBreakdown;
  if (batch.salesModel === "FARMER_OWNED") {
    if (batch.purchase) throw new Error(`${batch.id}: a farmer-owned batch has no purchase`);
    if (input.farmerPricePerKg === undefined) throw new Error(`${input.id}: farmer-owned needs farmerPricePerKg`);
    priceBreakdown = {
      model: "FARMER_OWNED",
      farmerShare: input.farmerPricePerKg * kg,
      processingFee: partner.processingFeePerKg * kg,
      platformFee,
    };
  } else {
    if (!batch.purchase) throw new Error(`${batch.id}: a partner-sourced batch needs a purchase`);
    if (input.partnerMarginPerKg === undefined) throw new Error(`${input.id}: partner-sourced needs a partner margin`);
    priceBreakdown = {
      model: "PARTNER_SOURCED",
      // The published raw-produce price, scaled to this pack (raw kg needed per packed kg).
      paidToFarmer: Math.round(batch.purchase.pricePerKg * (batch.inputKg / batch.outputKg) * kg),
      partnerMargin: input.partnerMarginPerKg * kg,
      platformFee,
    };
  }

  const base = {
    id: input.id,
    name: input.name,
    salesModel: batch.salesModel,
    batchId: batch.id,
    farmerId: batch.farmerId,
    partnerId: batch.partnerId,
    bagSizeKg: kg,
    priceBreakdown,
    price: priceTotal(priceBreakdown),
    description: input.description,
    tags: input.tags,
    inStock: input.inStock ?? true,
    featured: input.featured ?? false,
  };

  if (batch.categoryId === "rice") {
    return { ...base, categoryId: "rice", variety: batch.variety, age: batch.age };
  }
  return {
    ...base,
    categoryId: "onions",
    variety: batch.variety,
    sizeGrade: batch.sizeGrade,
    shelfLifeDays: batch.shelfLifeDays,
  };
}

export const products: Product[] = [
  makeProduct({
    id: "aged-sona-masoori-10kg",
    name: "Aged Sona Masoori",
    batchId: "KS-2026-0412-SM",
    bagSizeKg: 10,
    farmerPricePerKg: 62,
    description:
      "Six months of careful storage gives this Godavari delta Sona Masoori a light, fluffy cook. An everyday rice for meals and pulihora.",
    tags: ["Everyday", "Low-chemical", "Aged 6 months"],
    featured: true,
  }),
  makeProduct({
    id: "chittimutyalu-5kg",
    name: "Chittimutyalu",
    batchId: "KS-2026-0820-CM",
    bagSizeKg: 5,
    farmerPricePerKg: 85,
    description:
      "Short, pearl-like aromatic grains, the classic choice for biryani and pulao in coastal Andhra kitchens.",
    tags: ["Aromatic", "Biryani", "Low-chemical"],
    featured: true,
  }),
  makeProduct({
    id: "telangana-sona-10kg",
    name: "Telangana Sona (RNR 15048)",
    batchId: "KS-2026-0805-TS",
    bagSizeKg: 10,
    farmerPricePerKg: 56,
    description:
      "A low glycaemic index variety from PJTSAU, grown naturally by Lakshmi Devi. Soft, slender grains suited to daily meals.",
    tags: ["Low GI", "Natural farming", "New crop"],
    featured: true,
  }),
  makeProduct({
    id: "brown-sona-masoori-5kg",
    name: "Brown Sona Masoori",
    batchId: "KS-2026-0901-BR",
    bagSizeKg: 5,
    farmerPricePerKg: 72,
    description:
      "Only the husk is removed, so the bran layer stays on. Nutty, high in fibre, and grown with natural farming.",
    tags: ["Brown rice", "High fibre", "Natural farming"],
  }),
  makeProduct({
    id: "aged-bpt-5204-25kg",
    name: "Aged BPT 5204",
    batchId: "KS-2026-0315-BP",
    bagSizeKg: 25,
    farmerPricePerKg: 60,
    description:
      "The family-size bag. Krishna delta Samba Masuri, aged seven months so it cooks into separate, non-sticky grains.",
    tags: ["Family pack", "Aged 7 months", "Everyday"],
    featured: true,
  }),
  makeProduct({
    id: "jeelakara-sannalu-5kg",
    name: "Aged Jeelakara Sannalu",
    batchId: "KS-2026-0220-JS",
    bagSizeKg: 5,
    farmerPricePerKg: 82,
    description:
      "Tiny cumin-shaped grains with a delicate aroma, aged for eight months. Small batch, ideal for festive cooking.",
    tags: ["Aromatic", "Small batch", "Aged 8 months"],
    inStock: false,
  }),

  // ----- PARTNER_SOURCED rice -----
  makeProduct({
    id: "sona-masoori-mill-select-25kg",
    name: "Sona Masoori, Mill Select",
    batchId: "KS-2026-0910-SP",
    bagSizeKg: 25,
    partnerMarginPerKg: 7,
    description:
      "Sri Godavari Rice Mill bought this new-crop Sona Masoori from Srinivas Rao at a published price, then milled and sorted it. A great-value family bag.",
    tags: ["Family pack", "New crop", "Great value"],
  }),
  makeProduct({
    id: "aged-bpt-mill-select-10kg",
    name: "Aged BPT 5204, Mill Select",
    batchId: "KS-2026-0618-BA",
    bagSizeKg: 10,
    partnerMarginPerKg: 8,
    description:
      "Paddy bought from Venkata Ramana and aged at the mill for four months. Separate, non-sticky grains for everyday meals.",
    tags: ["Everyday", "Aged 4 months"],
  }),
  makeProduct({
    id: "telangana-sona-mill-select-5kg",
    name: "Telangana Sona, Mill Select",
    batchId: "KS-2026-0828-TP",
    bagSizeKg: 5,
    partnerMarginPerKg: 9,
    description:
      "Kakatiya Agro Mill sourced this low-GI RNR 15048 from Lakshmi Devi's natural farm. A small bag to try before you buy big.",
    tags: ["Low GI", "Natural farming", "Trial pack"],
  }),

  // ----- FARMER_OWNED onions -----
  makeProduct({
    id: "nashik-red-onions-5kg",
    name: "Nashik Red Onions",
    batchId: "KS-2026-1005-NR",
    bagSizeKg: 5,
    farmerPricePerKg: 28,
    description:
      "Large, deep-red Nashik onions, field-cured for 12 days so the skins are dry and tight. Medium pungency for everyday curries.",
    tags: ["Large", "Field-cured", "Everyday"],
    featured: true,
  }),
  makeProduct({
    id: "bellary-onions-10kg",
    name: "Bellary Onions",
    batchId: "KS-2026-1008-BL",
    bagSizeKg: 10,
    farmerPricePerKg: 24,
    description:
      "The mild, light-skinned Bellary onion from Mallikarjuna Gowda's Tungabhadra fields. A 10 kg bag for the month's cooking.",
    tags: ["Mild", "Monthly pack"],
    featured: true,
  }),
  makeProduct({
    id: "kurnool-onions-2kg",
    name: "Kurnool Onions",
    batchId: "KS-2026-1001-KN",
    bagSizeKg: 2,
    farmerPricePerKg: 30,
    description:
      "Small, strongly pungent onions from a natural farm in Pattikonda. Perfect for pickles, chutneys and tempering.",
    tags: ["Pungent", "Natural farming", "Small bulbs"],
  }),

  // ----- PARTNER_SOURCED onions -----
  makeProduct({
    id: "nashik-red-stored-10kg",
    name: "Nashik Red, Packhouse Stored",
    batchId: "KS-2026-1003-NS",
    bagSizeKg: 10,
    partnerMarginPerKg: 6,
    description:
      "Rabi-season Nashik Red bought from Shankar Pawar and stored in the packhouse's ventilated sheds. Firm and long-keeping.",
    tags: ["Long-keeping", "Monthly pack"],
  }),
  makeProduct({
    id: "bellary-large-1kg",
    name: "Bellary Onions, Large",
    batchId: "KS-2026-1009-BP",
    bagSizeKg: 1,
    partnerMarginPerKg: 7,
    description:
      "Hand-picked large Bellary bulbs, sourced by Kurnool Agri Packhouse from Mallikarjuna Gowda. A 1 kg pack for small kitchens.",
    tags: ["Large", "Mild", "Trial pack"],
  }),
  makeProduct({
    id: "kurnool-onions-5kg",
    name: "Kurnool Onions, Packhouse Graded",
    batchId: "KS-2026-1002-KP",
    bagSizeKg: 5,
    partnerMarginPerKg: 6,
    description:
      "Medium Kurnool onions bought from Venkatesh Naidu's natural farm, then machine-graded for even size.",
    tags: ["Pungent", "Graded", "Natural farming"],
    inStock: false,
  }),
];

// Lookup helpers. Pages use these so swapping to APIs in Phase 2 is one place.
export const getFarmer = (id: string) => farmers.find((f) => f.id === id);
export const getPartner = (id: string) => partners.find((p) => p.id === id);
export const getBatch = (id: string) => batches.find((b) => b.id === id);
export const getProduct = (id: string) => products.find((p) => p.id === id);

export const productsIn = (categoryId: CategoryId) => products.filter((p) => p.categoryId === categoryId);
export const batchesIn = (categoryId: CategoryId) => batches.filter((b) => b.categoryId === categoryId);

// Typed category views (narrowed unions) for category-specific pages.
export const riceProducts = products.filter((p): p is RiceProduct => p.categoryId === "rice");
export const onionProducts = products.filter((p): p is OnionProduct => p.categoryId === "onions");
export const riceBatches = batches.filter((b): b is RiceBatch => b.categoryId === "rice");
export const onionBatches = batches.filter((b): b is OnionBatch => b.categoryId === "onions");
export const getRiceProduct = (id: string) => riceProducts.find((p) => p.id === id);
export const getRiceBatch = (id: string) => riceBatches.find((b) => b.id === id);

/** Farmers with at least one product in the category. */
export const farmersIn = (categoryId: CategoryId) =>
  farmers.filter((f) => products.some((p) => p.categoryId === categoryId && p.farmerId === f.id));
