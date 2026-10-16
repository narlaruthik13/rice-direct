import type { CartItem, Product } from "@kisa/shared";
import { getProduct } from "@/data/mock";

export interface CartLine extends CartItem {
  product: Product;
}

/** Join cart items with catalogue data; drop anything no longer in the catalogue. */
export function getCartLines(items: CartItem[]): CartLine[] {
  return items.flatMap((item) => {
    const product = getProduct(item.productId);
    return product ? [{ ...item, product }] : [];
  });
}

/** One honest total: customers see only the price of each pack. */
export function cartTotals(lines: CartLine[]) {
  return lines.reduce(
    (acc, { product, quantity }) => ({ price: acc.price + product.price * quantity, bags: acc.bags + quantity }),
    { price: 0, bags: 0 },
  );
}
