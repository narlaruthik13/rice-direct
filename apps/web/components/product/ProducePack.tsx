import type { Product } from "@kisa/shared";
import { categories, productBadge } from "@/lib/categories";
import { RiceBagShape } from "@/components/product/RiceBag";
import { OnionBagShape } from "@/components/product/OnionBag";

const ACCENTS = { field: "#2F4A2A", husk: "#8B5E3C" } as const;

/** The pack illustration for any product, chosen by its category's pack style. */
export function ProducePack({ product, farmerName, className = "" }: { product: Product; farmerName: string; className?: string }) {
  const category = categories[product.categoryId];
  const tone = productBadge(product).tone;
  const shared = { farmerName, variety: product.variety, weightKg: product.bagSizeKg, batchId: product.batchId };

  return (
    <svg
      viewBox="20 18 200 288"
      className={className}
      role="img"
      aria-label={`${product.bagSizeKg} kg ${category.pack.noun} of ${product.variety} ${category.nouns.product} from ${farmerName}`}
    >
      {category.pack.style === "mesh-bag" ? (
        <OnionBagShape {...shared} bulbColor={category.varietyColors?.[product.variety]} accent={ACCENTS[tone]} />
      ) : (
        <RiceBagShape {...shared} aged={tone === "husk"} />
      )}
    </svg>
  );
}
