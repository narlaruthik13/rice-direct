// Query schemas for the public catalogue endpoints.
import { z } from "zod";

export const SalesModelSchema = z.enum(["FARMER_OWNED", "PARTNER_SOURCED"]);

export const ProductListQuerySchema = z
  .object({
    /** Category id, e.g. "rice" or "onions". */
    category: z.string().regex(/^[a-z0-9-]{1,40}$/, "Invalid category").optional(),
    salesModel: SalesModelSchema.optional(),
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
