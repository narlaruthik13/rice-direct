import type { OnionBagInfo } from "@/components/onion/OnionScene";
import { categories } from "@/lib/categories";
import { getFarmer, onionProducts } from "@/data/mock";

/** The bag shown in the onion story: the first featured farmer-owned onion product. */
export function onionStoryBag(): OnionBagInfo {
  const product = onionProducts.find((p) => p.featured && p.salesModel === "FARMER_OWNED") ?? onionProducts[0];
  return {
    farmerName: getFarmer(product.farmerId)?.name ?? "",
    variety: product.variety,
    weightKg: product.bagSizeKg,
    batchId: product.batchId,
    bulbColor: categories.onions.varietyColors?.[product.variety] ?? "#8E2F45",
  };
}
