// Query schemas for the public catalogue endpoints.
import { z } from "zod";
import { RICE_AGES, RICE_TYPES } from "../categories";

export const ProductListQuerySchema = z
  .object({
    /** Category id; only "rice" today. */
    category: z.string().regex(/^[a-z0-9-]{1,40}$/, "Invalid category").optional(),
    riceType: z.enum(RICE_TYPES).optional(),
    /** Variety slug, e.g. "sona-masoori". */
    variety: z.string().regex(/^[a-z0-9-]{1,60}$/, "Invalid variety").optional(),
    age: z.enum(RICE_AGES).optional(),
    /** Pack size in kg, e.g. 10. */
    packSize: z.coerce.number().int().positive().max(100).optional(),
    /** "true": only products with enough stock for one pack. */
    inStock: z
      .enum(["true", "false"])
      .transform((v) => v === "true")
      .optional(),
  })
  .strict();
export type ProductListQuery = z.infer<typeof ProductListQuerySchema>;

export const BatchIdSchema = z.string().regex(/^[A-Z0-9-]{3,40}$/, "Invalid batch id");
export const ProductSlugSchema = z.string().regex(/^[a-z0-9-]{1,80}$/, "Invalid product slug");
