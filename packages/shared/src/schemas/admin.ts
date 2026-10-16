// Request schemas for the admin endpoints. Used by apps/api for validation and by
// apps/admin for forms, so both always agree. Money is in rupees (up to 2 decimals).
// Update schemas have no defaults: an update must never fill in a field that wasn't sent.
import { z } from "zod";
import { CATEGORY_RULES, isKnownCategory, isoDateSchema, RICE_AGES, RICE_TYPES } from "../categories";

const text = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min, min === 1 ? "Required" : `At least ${min} characters`)
    .max(max);

/** Rupees with at most 2 decimals (stored as whole paise). */
export const rupeesSchema = z
  .number({ error: "Enter an amount" })
  .min(0, "Can't be negative")
  .max(1_000_000)
  .refine((v) => Math.abs(Math.round(v * 100) - v * 100) < 1e-6, "At most 2 decimals");

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();

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

export const MillListQuerySchema = z
  .object({
    search: z.string().trim().max(80).optional(),
    status: ActiveFilterSchema,
    sort: z.enum(["name", "town", "createdAt"]).default("name"),
    ...pageParams,
  })
  .strict();
export type MillListQuery = z.infer<typeof MillListQuerySchema>;

export const VarietyListQuerySchema = z
  .object({
    search: z.string().trim().max(80).optional(),
    status: ActiveFilterSchema,
    category: z.string().regex(/^[a-z0-9-]{1,40}$/).optional(),
    sort: z.enum(["name", "createdAt"]).default("name"),
    ...pageParams,
  })
  .strict();
export type VarietyListQuery = z.infer<typeof VarietyListQuerySchema>;

export const StockStatusSchema = z.enum(["in_stock", "low", "sold_out"]);
export type StockStatus = z.infer<typeof StockStatusSchema>;

export const BatchListQuerySchema = z
  .object({
    search: z.string().trim().max(80).optional(),
    category: z.string().regex(/^[a-z0-9-]{1,40}$/).optional(),
    varietyId: z.string().max(40).optional(),
    millId: z.string().max(40).optional(),
    riceType: z.enum(RICE_TYPES).optional(),
    age: z.enum(RICE_AGES).optional(),
    stock: StockStatusSchema.optional(),
    /** Best-before within 30 days (and still on sale). */
    expiringSoon: z
      .enum(["true", "false"])
      .transform((v) => v === "true")
      .optional(),
    sort: z.enum(["packedDate", "createdAt", "availableKg", "bestBefore", "id"]).default("packedDate"),
    ...pageParams,
    order: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict();
export type BatchListQuery = z.infer<typeof BatchListQuerySchema>;

// ---------- Mills ----------

const millFields = {
  name: text(2, 100),
  contactName: optionalText(80),
  phone: phoneSchema,
  town: text(2, 80),
  district: text(2, 80),
  state: text(2, 80),
  fssaiLicense: z
    .string()
    .trim()
    .regex(/^\d{14}$/, "14-digit FSSAI licence number")
    .or(z.literal(""))
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
  certifications: z.array(text(2, 60)).max(10),
};
export const MillInputSchema = z.object({ ...millFields, certifications: millFields.certifications.default([]) }).strict();
export type MillInput = z.input<typeof MillInputSchema>;
export const MillUpdateSchema = z.object(millFields).partial().strict();

// ---------- Varieties ----------

export const VarietyInputSchema = z
  .object({
    categoryId: z.string().regex(/^[a-z0-9-]{1,40}$/, "Choose a category"),
    name: text(2, 60),
  })
  .strict();
export type VarietyInput = z.input<typeof VarietyInputSchema>;
/** The slug stays fixed after creation (it is used in website links and filters). */
export const VarietyUpdateSchema = z.object({ name: text(2, 60) }).partial().strict();

// ---------- Products ----------

export const ProductInputSchema = z
  .object({
    name: text(2, 100),
    bagSizeKg: z.number().int().positive(),
    /** Per pack, paid to the mill. Never shown publicly. */
    millPrice: rupeesSchema,
    /** Per pack, Kisa's margin. Never shown publicly. */
    kisaMargin: rupeesSchema,
    /** Must equal millPrice + kisaMargin. */
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
    millPrice: rupeesSchema,
    kisaMargin: rupeesSchema,
    price: rupeesSchema,
    description: text(10, 1000),
    tags: z.array(text(1, 40)).max(8),
    featured: z.boolean(),
  })
  .partial()
  .strict();

/** Price = mill price + Kisa margin, compared in whole paise. */
export const priceMatchesParts = (p: { millPrice: number; kisaMargin: number; price: number }) =>
  Math.round(p.price * 100) === Math.round(p.millPrice * 100) + Math.round(p.kisaMargin * 100);

// ---------- Batches ----------

const batchFields = {
  varietyId: z.string().min(1, "Choose a variety").max(40),
  millId: z.string().min(1, "Choose a mill").max(40),
  millingDate: isoDateSchema,
  packedDate: isoDateSchema,
  /** Defaults to packedDate + the category's shelf life. */
  bestBefore: isoDateSchema,
  packedKg: z.number({ error: "Enter the kg packed" }).int().positive("Must be more than 0").max(10_000_000),
  /** Category-specific, e.g. rice { riceType, age }. */
  attributes: z.record(z.string(), z.unknown()),
  quality: z.record(z.string(), z.unknown()),
};

export type BatchFields = {
  categoryId: string;
  millingDate: string;
  packedDate: string;
  bestBefore?: string | null;
  attributes: Record<string, unknown>;
  quality: Record<string, unknown>;
};

/**
 * Cross-field rules for a whole batch (create, or current values merged with an update):
 * the category's attribute and quality schemas, and packed on or after milling, and
 * best-before after packing.
 */
export function batchIssues(b: BatchFields): { path: string; message: string }[] {
  if (!isKnownCategory(b.categoryId)) return [{ path: "categoryId", message: "Unknown category" }];
  const rules = CATEGORY_RULES[b.categoryId];
  const issues: { path: string; message: string }[] = [];
  if (b.packedDate < b.millingDate) issues.push({ path: "packedDate", message: "Packed date can't be before milling" });
  if (b.bestBefore && b.bestBefore <= b.packedDate) issues.push({ path: "bestBefore", message: "Best-before must be after the packed date" });
  for (const [key, schema] of [["attributes", rules.attributes], ["quality", rules.quality]] as const) {
    const r = schema.safeParse(b[key]);
    if (!r.success) for (const i of r.error.issues) issues.push({ path: [key, ...i.path].join(".") || key, message: i.message });
  }
  return issues;
}

export const BatchCreateSchema = z
  .object({
    categoryId: z.string().min(1),
    ...batchFields,
    bestBefore: batchFields.bestBefore.optional(),
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
