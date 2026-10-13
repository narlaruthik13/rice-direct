import type { CartItem, Farmer, Product } from "@/lib/types";
import { getFarmer, getProduct } from "@/data/mock";

export interface CartLine extends CartItem {
  product: Product;
  farmer: Farmer;
}

/** Join cart items with catalogue data; drop anything no longer in the catalogue. */
export function getCartLines(items: CartItem[]): CartLine[] {
  return items.flatMap((item) => {
    const product = getProduct(item.productId);
    const farmer = product && getFarmer(product.farmerId);
    return product && farmer ? [{ ...item, product, farmer }] : [];
  });
}

/** Sums each part of the price breakdown across all lines. */
export function cartTotals(lines: CartLine[]) {
  return lines.reduce(
    (acc, { product, quantity }) => ({
      farmerShare: acc.farmerShare + product.priceBreakdown.farmerShare * quantity,
      millingFee: acc.millingFee + product.priceBreakdown.millingFee * quantity,
      platformFee: acc.platformFee + product.priceBreakdown.platformFee * quantity,
      price: acc.price + product.price * quantity,
      bags: acc.bags + quantity,
    }),
    { farmerShare: 0, millingFee: 0, platformFee: 0, price: 0, bags: 0 },
  );
}

export const farmerCount = (lines: CartLine[]) => new Set(lines.map((l) => l.farmer.id)).size;
