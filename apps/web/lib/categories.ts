// Category configuration. Adding a crop = adding an entry here (plus its
// variety/attribute types and mock data); components read everything else from config.

import type { Category, CategoryId, PartnerType, ProcessStep, Product, SalesModel } from "@kisa/shared";

export const categories: Record<CategoryId, Category> = {
  rice: {
    id: "rice",
    name: "Rice",
    slug: "rice",
    tagline: "Aged and new-crop rice, milled to order",
    shopIntro:
      "Every bag is one farmer's batch, milled by a partner mill. Pick by variety, farm, price, who sells it, or whether you like it new or aged.",
    theme: { bg: "#F4E3B5", accent: "#A67E12" },
    filters: [
      {
        key: "age",
        param: "age",
        label: "Rice age",
        options: [
          { value: "new", label: "New crop" },
          { value: "aged", label: "Aged" },
        ],
      },
    ],
    particle: { shape: "grain", colors: ["#EBCB6E", "#FBF7EE", "#D4A62A", "#FBF7EE"] },
    nouns: { raw: "paddy", product: "rice", this: "this rice", inLabel: "Paddy in", outLabel: "Rice out", yieldLabel: "Yield" },
    pack: { style: "jute-sack", noun: "bag" },
    badge: { key: "age", values: { aged: "Aged", new: "New crop" }, tones: { aged: "husk", new: "field" } },
    quality: {
      limits: [
        { key: "moisturePct", label: "Moisture", unit: "%", limit: 14 },
        { key: "brokenPct", label: "Broken grains", unit: "%", limit: 5 },
        { key: "foreignMatterPct", label: "Foreign matter", unit: "%", limit: 0.25 },
      ],
      highlights: [{ key: "grainLengthMm", label: "Avg. grain length", unit: "mm" }],
    },
    partnerType: "MILL",
    steps: ["harvest", "milling", "packing"],
    attributes: [
      { key: "variety", label: "Variety" },
      { key: "age", label: "Aged / new", values: { aged: "Aged", new: "New crop" } },
      { key: "brokenPct", label: "Broken grains", unit: "%" },
      { key: "moisturePct", label: "Moisture", unit: "%" },
    ],
    varieties: ["Sona Masoori", "BPT 5204", "RNR 15048", "Chittimutyalu", "Jeelakara Sannalu", "Brown Sona Masoori"],
    packSizesKg: [5, 10, 25],
    perishable: false,
    platformFeePerKg: 3,
  },
  onions: {
    id: "onions",
    name: "Onions",
    slug: "onions",
    tagline: "Field-cured onions, graded by size",
    shopIntro:
      "Cured to toughen the skins, then graded and packed by partner packhouses. Pick by variety, bulb size, farm, price or who sells it.",
    theme: { bg: "#F3D9D4", accent: "#8E2F45" },
    filters: [
      {
        key: "sizeGrade",
        param: "size",
        label: "Bulb size",
        options: [
          { value: "small", label: "Small" },
          { value: "medium", label: "Medium" },
          { value: "large", label: "Large" },
        ],
      },
    ],
    particle: { shape: "bulb", colors: ["#8E2F45", "#D39A93", "#76263A"] },
    nouns: { raw: "onions", product: "onions", this: "these onions", inLabel: "Harvested", outLabel: "Packed", yieldLabel: "Kept" },
    pack: { style: "mesh-bag", noun: "mesh bag" },
    badge: { key: "sizeGrade", values: { small: "Small", medium: "Medium", large: "Large" } },
    varietyColors: { "Nashik Red": "#8E2F45", Bellary: "#D39A93", Kurnool: "#76263A" },
    quality: {
      limits: [
        { key: "damagedPct", label: "Damaged bulbs", unit: "%", limit: 3 },
        { key: "sproutedPct", label: "Sprouted", unit: "%", limit: 1 },
      ],
      highlights: [
        { key: "avgSizeMm", label: "Avg. bulb size", unit: "mm" },
        { key: "pungency", label: "Pungency" },
      ],
    },
    partnerType: "PACKHOUSE",
    steps: ["harvest", "curing", "grading", "packing"],
    attributes: [
      { key: "variety", label: "Variety" },
      {
        key: "sizeGrade",
        label: "Size grade",
        values: { small: "Small (40–55 mm)", medium: "Medium (55–65 mm)", large: "Large (65+ mm)" },
      },
      { key: "curingDays", label: "Curing", unit: "days" },
      { key: "shelfLifeDays", label: "Shelf life", unit: "days" },
    ],
    varieties: ["Nashik Red", "Bellary", "Kurnool"],
    packSizesKg: [1, 2, 5, 10],
    perishable: true,
    platformFeePerKg: 2,
  },
};

export const categoryList = Object.values(categories);

export const getCategory = (id: CategoryId) => categories[id];
export const getCategoryBySlug = (slug: string) => categoryList.find((c) => c.slug === slug);

export const STEP_LABELS: Record<ProcessStep, string> = {
  harvest: "Harvest",
  milling: "Milling",
  curing: "Curing",
  grading: "Grading",
  packing: "Packing",
};

/** Past-tense step labels for summaries ("Milled 12 Apr 2026"). */
export const STEP_DONE: Record<ProcessStep, string> = {
  harvest: "Harvested",
  milling: "Milled",
  curing: "Cured",
  grading: "Graded",
  packing: "Packed",
};

/** Wording that depends on the partner type (used by model-aware price labels and copy). */
export const PARTNER_TYPES: Record<
  PartnerType,
  {
    noun: string;
    /** Capitalised, for badges: "Mill-Direct". */
    name: string;
    title: string;
    verb: string;
    work: string;
    workDone: string;
    feeLabel: string;
    marginLabel: string;
  }
> = {
  MILL: {
    noun: "mill",
    name: "Mill",
    title: "Partner mill",
    verb: "milled at",
    work: "hulls, polishes and tests",
    workDone: "hulled, polished and tested",
    feeLabel: "Milling fee",
    marginLabel: "Mill margin",
  },
  PACKHOUSE: {
    noun: "packhouse",
    name: "Packhouse",
    title: "Partner packhouse",
    verb: "cured and packed at",
    work: "cures, grades and packs",
    workDone: "cured, graded and packed",
    feeLabel: "Packhouse fee",
    marginLabel: "Packhouse margin",
  },
};

/**
 * Sales-model badge text: "Farmer-Owned", or "<Partner>-Direct" where the partner
 * is the category's partner type (Mill for rice, Packhouse for onions).
 */
export function salesModelInfo(model: SalesModel, categoryId: CategoryId) {
  const partner = PARTNER_TYPES[categories[categoryId].partnerType];
  return model === "FARMER_OWNED"
    ? {
        label: "Farmer-Owned",
        description: `The farmer owns this lot and pays the ${partner.noun} a fee to process it.`,
      }
    : {
        label: `${partner.name}-Direct`,
        description: `The ${partner.noun} bought this lot from the farmer at a published price.`,
      };
}

/** The short badge for a product card/page, from the category's badge config. */
export function productBadge(product: Product) {
  const { badge } = categories[product.categoryId];
  const raw = String((product as unknown as Record<string, unknown>)[badge.key] ?? "");
  return { label: badge.values[raw] ?? raw, tone: badge.tones?.[raw] ?? "field" };
}

const fmt = (value: unknown, unit?: string) =>
  unit ? `${value}${unit === "%" ? "%" : ` ${unit}`}` : String(value);

/** Quality measures with their limits checked, plus display-only highlights. */
export function qualityChecks(categoryId: CategoryId, quality: object) {
  const q = quality as Record<string, unknown>;
  const { limits, highlights } = categories[categoryId].quality;
  const checks = limits.flatMap((def) => {
    const value = q[def.key];
    if (typeof value !== "number") return [];
    return [{ ...def, value, display: fmt(value, def.unit), ok: def.limit === undefined || value <= def.limit }];
  });
  const extras = highlights.flatMap((def) =>
    q[def.key] === undefined ? [] : [{ ...def, display: fmt(q[def.key], def.unit) }],
  );
  return { checks, highlights: extras, allOk: checks.every((c) => c.ok) };
}

/**
 * Resolves a category's attribute list for display, reading each key from the
 * product, then the batch, then the batch's quality report.
 */
export function attributeValues(categoryId: CategoryId, sources: object[]) {
  return categories[categoryId].attributes.flatMap((def) => {
    const raw = sources
      .map((s) => (s as Record<string, unknown>)[def.key])
      .find((v) => v !== undefined && v !== null);
    if (raw === undefined) return [];
    const text = def.values?.[String(raw)] ?? String(raw);
    return [{ key: def.key, label: def.label, value: def.unit ? fmt(text, def.unit) : text }];
  });
}
