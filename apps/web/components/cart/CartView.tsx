"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import type { Product } from "@kisa/shared";
import { cartTotals, getCartLines } from "@/lib/cart";
import { formatINR } from "@/lib/format";
import { useCartHydrated, useCartStore } from "@/store/cart";
import { RiceBag } from "@/components/product/RiceBag";
import { typeLabel } from "@/lib/rice";
import { buttonClasses } from "@/components/ui/Button";

const MAX_QTY = 10;

export function CartView({ products }: { products: Product[] }) {
  const hydrated = useCartHydrated();
  const items = useCartStore((s) => s.items);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const lines = getCartLines(items, products);

  // Avoid flashing "empty" before the saved cart loads from localStorage.
  if (!hydrated) {
    return <p className="mt-10 text-sm text-soil/60">Loading your cart…</p>;
  }

  if (lines.length === 0) {
    return (
      <div className="mt-10 rounded-2xl border border-dashed border-husk/30 p-12 text-center">
        <p className="font-display text-2xl text-field">Your cart is empty</p>
        <p className="mt-2 text-soil/70">Pick a bag of mill-fresh rice.</p>
        <Link href="/shop" className={buttonClasses("primary", "mt-6")}>
          Shop now
        </Link>
      </div>
    );
  }

  const totals = cartTotals(lines);

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
      <ul className="space-y-4">
        <AnimatePresence initial={false}>
          {lines.map(({ product, quantity }) => (
            <motion.li
              key={product.id}
              layout
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.2 }}
              className="flex gap-4 rounded-2xl bg-white/70 p-4 shadow-card ring-1 ring-husk/10 sm:gap-6 sm:p-5"
            >
              <Link
                href={`/product/${product.id}`}
                className="grid h-24 w-20 shrink-0 place-items-center rounded-xl bg-rice-dim sm:h-28 sm:w-24"
                aria-hidden="true"
                tabIndex={-1}
              >
                <RiceBag variety={product.variety.name} typeLabel={typeLabel(product.riceType)} weightKg={product.bagSizeKg} batchId={product.batchId} aged={product.age === "AGED"} className="h-[88%] w-auto" />
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/product/${product.id}`} className="font-display text-lg font-semibold text-field hover:underline">
                      {product.name}
                    </Link>
                    <p className="text-sm text-soil/70">
                      {product.bagSizeKg} kg · {product.variety.name}, {typeLabel(product.riceType)}
                    </p>
                    <span className="mt-1 block font-mono text-[11px] text-soil/50">{product.batchId}</span>
                  </div>
                  <p className="font-semibold tabular-nums">{formatINR(product.price * quantity)}</p>
                </div>

                <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                  <div className="flex items-center rounded-full border border-husk/30 bg-white/80" role="group" aria-label={`Quantity of ${product.name}`}>
                    <button
                      type="button"
                      className="h-10 w-10 rounded-full font-semibold text-field"
                      onClick={() => setQuantity(product.id, quantity - 1)}
                      aria-label={quantity === 1 ? `Remove ${product.name}` : "Decrease quantity"}
                    >
                      −
                    </button>
                    <span className="w-7 text-center text-sm font-semibold tabular-nums">{quantity}</span>
                    <button
                      type="button"
                      className="h-10 w-10 rounded-full font-semibold text-field disabled:opacity-30"
                      onClick={() => setQuantity(product.id, quantity + 1)}
                      disabled={quantity >= MAX_QTY}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  <span className="hidden text-xs text-soil/60 sm:inline">{formatINR(product.price)} each</span>
                  <button
                    type="button"
                    onClick={() => removeItem(product.id)}
                    className="px-2 py-2.5 text-sm font-medium text-soil/60 underline-offset-4 hover:text-red-800 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      <aside className="h-fit rounded-2xl bg-white/70 p-6 shadow-card ring-1 ring-husk/10 lg:sticky lg:top-24">
        <h2 className="text-xl font-semibold text-field">Order summary</h2>
        <p className="mt-1 text-sm text-soil/70">
          {totals.bags} {totals.bags === 1 ? "pack" : "packs"}
        </p>

        <div className="mt-5 flex justify-between border-t border-husk/15 pt-4 font-semibold">
          <span>Total</span>
          <span className="tabular-nums" data-testid="cart-total">
            {formatINR(totals.price)}
          </span>
        </div>

        <div className="mt-3 flex justify-between text-sm text-soil/70">
          <span>Delivery</span>
          <span>Calculated at checkout</span>
        </div>

        <p className="mt-5 rounded-xl bg-field/10 p-3 text-sm text-field">Mill-fresh rice, honestly priced: no middlemen, no hidden fees.</p>

        <Link href="/checkout" className={buttonClasses("primary", "mt-5 w-full py-3")}>
          Proceed to checkout
        </Link>
        <Link href="/shop" className="mt-2 block py-2.5 text-center text-sm font-medium text-field hover:underline">
          Continue shopping
        </Link>
      </aside>
    </div>
  );
}
