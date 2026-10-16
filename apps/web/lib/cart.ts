import type { CartItem, Product } from "@kisa/shared";

export interface CartLine extends CartItem {
  product: Product;
}

/** Join cart items with catalogue data (loaded by the page); drop anything no longer on sale. */
export function getCartLines(items: CartItem[], products: Product[]): CartLine[] {
  return items.flatMap((item) => {
    const product = products.find((p) => p.id === item.productId);
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
