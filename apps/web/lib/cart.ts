import type { CartItem, Farmer, Product } from "@kisa/shared";
import { getFarmer, getProduct } from "@/data/mock";
import { addSplit, EMPTY_SPLIT, toSplit } from "@/lib/pricing";

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

/**
 * Sums the cart into a model-neutral split (farmer / partner / platform), so a
 * cart can mix FARMER_OWNED and PARTNER_SOURCED products and categories.
 */
export function cartTotals(lines: CartLine[]) {
  return lines.reduce(
    (acc, { product, quantity }) => ({
      split: addSplit(acc.split, toSplit(product.priceBreakdown), quantity),
      price: acc.price + product.price * quantity,
      bags: acc.bags + quantity,
    }),
    { split: EMPTY_SPLIT, price: 0, bags: 0 },
  );
}

export const farmerCount = (lines: CartLine[]) => new Set(lines.map((l) => l.farmer.id)).size;
