/**
 * Exports apps/web mock data to prisma/seed-data.json, so the seed uses the exact
 * products and prices the website shows today (computed by makeProduct in mock.ts).
 *
 * Run from the repo root (needs apps/web's "@/..." path alias):
 *   pnpm --filter @kisa/db db:export-mock
 * Output stays in the mock's units (₹, kg); prisma/seed.ts converts to paise.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { batches, farmers, partners, products } from "../../../apps/web/data/mock";
import { categoryList } from "../../../apps/web/lib/categories";

const out = {
  source: "apps/web/data/mock.ts",
  categories: categoryList.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    partnerType: c.partnerType,
    perishable: c.perishable,
    platformFeePerKg: c.platformFeePerKg,
    packSizesKg: c.packSizesKg,
  })),
  farmers,
  partners,
  batches,
  products,
};

const file = join(__dirname, "..", "prisma", "seed-data.json");
writeFileSync(file, JSON.stringify(out, null, 2) + "\n");
console.log(
  JSON.stringify({ file, categories: out.categories.length, farmers: farmers.length, partners: partners.length, batches: batches.length, products: products.length }),
);
