// Request schemas for the admin endpoints. Used by apps/api for validation and by
// apps/admin for forms, so both always agree. Money is in rupees (up to 2 decimals).
import { z } from "zod";
import { CROPS, isCategoryId, isoDateSchema } from "../crops";

const text = (min: number, max: number) => z.string().trim().min(min, min === 1 ? "Required" : `At least ${min} characters`).max(max);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();

/** Rupees with at most 2 decimals (stored as whole paise). */
export const rupeesSchema = z
  .number({ error: "Enter an amount" })
  .min(0, "Can't be negative")
  .max(1_000_000)
  .refine((v) => Math.abs(Math.round(v * 100) - v * 100) < 1e-6, "At most 2 decimals");

const phoneSchema = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "10-digit Indian mobile number")
  .or(z.literal(""))
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional();

// ---------- Lists ----------

export const ActiveFilterSchema = z.enum(["active", "inactive", "all"]).default("active");

const pageParams = {
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(20),
  order: z.enum(["asc", "desc"]).default("asc"),
};

export const FarmerListQuerySchema = z
  .object({
    search: z.string().trim().max(80).optional(),
    status: ActiveFilterSchema,
    sort: z.enum(["name", "district", "createdAt"]).default("name"),
    ...pageParams,
  })
  .strict();
export type FarmerListQuery = z.infer<typeof FarmerListQuerySchema>;

export const PartnerListQuerySchema = z
  .object({
    search: z.string().trim().max(80).optional(),
    status: ActiveFilterSchema,
    type: z.enum(["MILL", "PACKHOUSE"]).optional(),
    sort: z.enum(["name", "town", "processingFeePerKg", "createdAt"]).default("name"),
    ...pageParams,
  })
  .strict();
export type PartnerListQuery = z.infer<typeof PartnerListQuerySchema>;

export const StockStatusSchema = z.enum(["in_stock", "low", "sold_out"]);
export type StockStatus = z.infer<typeof StockStatusSchema>;

export const BatchListQuerySchema = z
  .object({
    search: z.string().trim().max(80).optional(),
    category: z.string().regex(/^[a-z0-9-]{1,40}$/).optional(),
    salesModel: z.enum(["FARMER_OWNED", "PARTNER_SOURCED"]).optional(),
    farmerId: z.string().max(40).optional(),
    partnerId: z.string().max(40).optional(),
    stock: StockStatusSchema.optional(),
    expiringSoon: z
      .enum(["true", "false"])
      .transform((v) => v === "true")
      .optional(),
    sort: z.enum(["packedDate", "createdAt", "availableKg", "id"]).default("packedDate"),
    ...pageParams,
    order: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict();
export type BatchListQuery = z.infer<typeof BatchListQuerySchema>;

// ---------- Farmers and partners ----------

export const FarmerInputSchema = z.object({
  name: text(2, 80),
  phone: phoneSchema,
  village: text(2, 80),
  district: text(2, 80),
  state: text(2, 80),
  acres: z.number({ error: "Enter the farm size" }).positive("Must be more than 0").max(10_000),
  yearsFarming: z.number({ error: "Enter years farming" }).int().min(0).max(80),
  method: z.enum(["conventional", "low-chemical", "natural"]),
  story: text(20, 2000),
  photoUrl: z.url().max(500).or(z.literal("")).transform((v) => (v === "" ? null : v)).nullable().optional(),
});
export type FarmerInput = z.input<typeof FarmerInputSchema>;
export const FarmerUpdateSchema = FarmerInputSchema.partial();

// Base fields without defaults: an update must never fill in a field the admin didn't send.
const partnerFields = {
  type: z.enum(["MILL", "PACKHOUSE"]),
  name: text(2, 100),
  phone: phoneSchema,
  town: text(2, 80),
  district: text(2, 80),
  state: text(2, 80),
  processingFeePerKg: rupeesSchema,
  certifications: z.array(text(2, 60)).max(10),
  established: z
    .number({ error: "Enter the year" })
    .int()
    .min(1900)
    .max(new Date().getFullYear()),
};
export const PartnerInputSchema = z.object({ ...partnerFields, certifications: partnerFields.certifications.default([]) });
export type PartnerInput = z.input<typeof PartnerInputSchema>;
export const PartnerUpdateSchema = z.object(partnerFields).partial();

// ---------- Products ----------

export const ProductInputSchema = z
  .object({
    name: text(2, 100),
    bagSizeKg: z.number().int().positive(),
    /** Per pack. FARMER_OWNED: farmer share; PARTNER_SOURCED: paid to farmer. */
    farmerShare: rupeesSchema,
    /** Per pack. FARMER_OWNED: processing fee; PARTNER_SOURCED: partner margin. */
    partnerShare: rupeesSchema,
    /** Per pack. Defaults to the category's per-kg platform fee × pack size. */
    platformFee: rupeesSchema.optional(),
    /** Must equal farmerShare + partnerShare + platformFee. */
    price: rupeesSchema,
    description: text(10, 1000),
    tags: z.array(text(1, 40)).max(8).default([]),
    featured: z.boolean().default(false),
  })
  .strict();
export type ProductInput = z.input<typeof ProductInputSchema>;

export const ProductUpdateSchema = z
  .object({
    name: text(2, 100),
    farmerShare: rupeesSchema,
    partnerShare: rupeesSchema,
    platformFee: rupeesSchema,
    price: rupeesSchema,
    description: text(10, 1000),
    tags: z.array(text(1, 40)).max(8),
    featured: z.boolean(),
  })
  .partial()
  .strict();

/** Price = farmer + partner + platform, compared in whole paise. */
export const priceMatchesParts = (p: { farmerShare: number; partnerShare: number; platformFee: number; price: number }) =>
  Math.round(p.price * 100) === Math.round(p.farmerShare * 100) + Math.round(p.partnerShare * 100) + Math.round(p.platformFee * 100);

// ---------- Batches ----------

const purchaseSchema = z.object({ date: isoDateSchema, pricePerKg: rupeesSchema.refine((v) => v > 0, "Must be more than 0") });

const batchFields = {
  salesModel: z.enum(["FARMER_OWNED", "PARTNER_SOURCED"]),
  farmerId: z.string().min(1, "Choose a farmer").max(40),
  partnerId: z.string().min(1, "Choose a partner").max(40),
  variety: text(2, 60),
  harvestDate: isoDateSchema,
  packedDate: isoDateSchema,
  inputKg: z.number().int().positive("Must be more than 0").max(10_000_000),
  outputKg: z.number().int().positive("Must be more than 0").max(10_000_000),
  /** PARTNER_SOURCED only (required there); FARMER_OWNED must not have one. */
  purchase: purchaseSchema.nullable().optional(),
  /** Perishable crops only (required there). */
  shelfLifeDays: z.number().int().min(1).max(365).nullable().optional(),
  attributes: z.record(z.string(), z.unknown()),
  quality: z.record(z.string(), z.unknown()),
};

export type BatchFields = {
  categoryId: string;
  salesModel: "FARMER_OWNED" | "PARTNER_SOURCED";
  variety: string;
  harvestDate: string;
  packedDate: string;
  inputKg: number;
  outputKg: number;
  purchase?: { date: string; pricePerKg: number } | null;
  shelfLifeDays?: number | null;
  attributes: Record<string, unknown>;
  quality: Record<string, unknown>;
};

/**
 * Cross-field rules for a whole batch (create, or current values merged with an
 * update): the crop's attributes, quality and varieties; the Model A/B purchase rule;
 * output <= input; packed on or after harvest; shelf life for perishables.
 */
export function batchIssues(b: BatchFields): { path: string; message: string }[] {
  const issues: { path: string; message: string }[] = [];
  if (!isCategoryId(b.categoryId)) return [{ path: "categoryId", message: "Unknown category" }];
  const crop = CROPS[b.categoryId];
  if (!crop.varieties.includes(b.variety)) issues.push({ path: "variety", message: `Choose a ${b.categoryId} variety` });
  if (b.outputKg > b.inputKg) issues.push({ path: "outputKg", message: "Output can't be more than input" });
  if (b.packedDate < b.harvestDate) issues.push({ path: "packedDate", message: "Packed date can't be before harvest" });
  if (b.salesModel === "PARTNER_SOURCED" && !b.purchase) {
    issues.push({ path: "purchase", message: "A partner-sourced batch needs the purchase date and price paid to the farmer" });
  }
  if (b.salesModel === "FARMER_OWNED" && b.purchase) {
    issues.push({ path: "purchase", message: "A farmer-owned batch has no purchase" });
  }
  if (crop.needsShelfLife && !b.shelfLifeDays) issues.push({ path: "shelfLifeDays", message: "Perishable: enter the shelf life" });
  if (!crop.needsShelfLife && b.shelfLifeDays) issues.push({ path: "shelfLifeDays", message: "Only perishable crops have a shelf life" });
  for (const [key, schema] of [["attributes", crop.attributes], ["quality", crop.quality]] as const) {
    const r = schema.safeParse(b[key]);
    if (!r.success) for (const i of r.error.issues) issues.push({ path: [key, ...i.path].join("."), message: i.message });
  }
  return issues;
}

export const BatchCreateSchema = z
  .object({
    categoryId: z.string().min(1),
    ...batchFields,
    products: z.array(ProductInputSchema).max(10).default([]),
  })
  .strict()
  .superRefine((b, ctx) => {
    for (const i of batchIssues(b)) ctx.addIssue({ code: "custom", path: i.path.split("."), message: i.message });
  });
export type BatchCreateInput = z.input<typeof BatchCreateSchema>;

/** Any subset of the batch fields; the API re-checks the merged batch with batchIssues. */
export const BatchUpdateSchema = z.object(batchFields).partial().strict();
export type BatchUpdateInput = z.input<typeof BatchUpdateSchema>;

// ---------- Stock ----------

export const StockAdjustmentSchema = z
  .object({
    deltaKg: z
      .number({ error: "Enter kg to add or remove" })
      .int("Whole kg only")
      .refine((v) => v !== 0, "Can't be 0")
      .refine((v) => Math.abs(v) <= 1_000_000, "Too large"),
    reason: z.enum(["DAMAGED", "RECOUNT", "RETURNED", "OTHER"], { error: "Choose a reason" }),
    note: z.string().trim().max(300).optional(),
  })
  .strict()
  .refine((v) => v.reason !== "OTHER" || (v.note && v.note.length >= 3), {
    path: ["note"],
    message: "Explain the reason",
  });
export type StockAdjustmentInput = z.input<typeof StockAdjustmentSchema>;
