// Category rules shared by the API (validation) and the admin (forms): the zod schemas
// for each category's batch attributes and quality report. Business numbers (pack sizes,
// shelf life) and varieties live in the database. A new category (e.g. dal) is a new
// entry here plus a Category row: no schema change.
import { z } from "zod";
import type { CategoryId, RiceAge, RiceType } from "./types";

export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .refine((v) => !Number.isNaN(Date.parse(`${v}T00:00:00Z`)), "Invalid date");

export const RICE_TYPES = ["RAW", "STEAM", "BOILED"] as const satisfies readonly RiceType[];
export const RICE_AGES = ["NEW", "AGED"] as const satisfies readonly RiceAge[];

export const RICE_TYPE_LABEL: Record<RiceType, string> = { RAW: "Raw", STEAM: "Steam", BOILED: "Boiled" };
export const RICE_AGE_LABEL: Record<RiceAge, string> = { NEW: "New crop", AGED: "Aged" };

const pct = (max: number) => z.number().min(0).max(max);

export const RiceAttributesSchema = z
  .object({
    riceType: z.enum(RICE_TYPES, { error: "Choose raw, steam or boiled" }),
    age: z.enum(RICE_AGES, { error: "Choose new or aged" }),
  })
  .strict();

export const RiceQualitySchema = z
  .object({
    moisturePct: pct(30),
    brokenPct: pct(100),
    foreignMatterPct: pct(100),
    grainLengthMm: z.number().min(1).max(15),
    testedBy: z.string().trim().min(2).max(120),
    testedOn: isoDateSchema,
    grade: z.enum(["A", "A+", "Premium"]),
  })
  .strict();

export interface CategoryRules {
  id: CategoryId;
  attributes: z.ZodType<Record<string, unknown>>;
  quality: z.ZodType<Record<string, unknown>>;
}

export const CATEGORY_RULES: Record<string, CategoryRules> = {
  rice: { id: "rice", attributes: RiceAttributesSchema, quality: RiceQualitySchema },
};

export const isKnownCategory = (id: string): boolean => Object.prototype.hasOwnProperty.call(CATEGORY_RULES, id);
