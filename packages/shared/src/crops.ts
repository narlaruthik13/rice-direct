// Crop rules shared by the API (validation) and the admin (forms): varieties, the
// partner type each crop needs, and the zod schemas for crop-specific batch fields.
// Business numbers (pack sizes, platform fee) live in the database Category table.
import { z } from "zod";
import type { CategoryId, PartnerType } from "./types";

export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD").refine((v) => !Number.isNaN(Date.parse(`${v}T00:00:00Z`)), "Invalid date");

const pct = (max: number) => z.number().min(0).max(max);
const grade = z.enum(["A", "A+", "Premium"]);
const lab = { testedBy: z.string().trim().min(2).max(120), testedOn: isoDateSchema, grade };

export const RiceAttributesSchema = z.object({
  millingDate: isoDateSchema,
  age: z.enum(["new", "aged"]),
});

export const RiceQualitySchema = z.object({
  moisturePct: pct(30),
  brokenPct: pct(100),
  foreignMatterPct: pct(100),
  grainLengthMm: z.number().min(1).max(15),
  ...lab,
});

export const OnionAttributesSchema = z.object({
  curingDays: z.number().int().min(0).max(60),
  gradingDate: isoDateSchema,
  sizeGrade: z.enum(["small", "medium", "large"]),
});

export const OnionQualitySchema = z.object({
  avgSizeMm: z.number().min(10).max(150),
  damagedPct: pct(100),
  sproutedPct: pct(100),
  skin: z.string().trim().min(2).max(80),
  pungency: z.enum(["Mild", "Medium", "Strong"]),
  ...lab,
});

export interface CropRules {
  id: CategoryId;
  partnerType: PartnerType;
  varieties: readonly string[];
  /** Perishable crops need a shelf life; batches stop selling at packedDate + shelfLifeDays. */
  needsShelfLife: boolean;
  attributes: z.ZodType<Record<string, unknown>>;
  quality: z.ZodType<Record<string, unknown>>;
}

export const CROPS: Record<CategoryId, CropRules> = {
  rice: {
    id: "rice",
    partnerType: "MILL",
    varieties: ["Sona Masoori", "BPT 5204", "RNR 15048", "Chittimutyalu", "Jeelakara Sannalu", "Brown Sona Masoori"],
    needsShelfLife: false,
    attributes: RiceAttributesSchema,
    quality: RiceQualitySchema,
  },
  onions: {
    id: "onions",
    partnerType: "PACKHOUSE",
    varieties: ["Nashik Red", "Bellary", "Kurnool"],
    needsShelfLife: true,
    attributes: OnionAttributesSchema,
    quality: OnionQualitySchema,
  },
};

export const isCategoryId = (id: string): id is CategoryId => id in CROPS;
