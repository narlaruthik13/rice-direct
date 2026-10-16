"use client";

import Link from "next/link";
import { useState } from "react";
import { useCartStore } from "@/store/cart";
import { flyGrainsToCart } from "@/lib/flyToCart";
import type { CategoryId } from "@kisa/shared";
import { categories } from "@/lib/categories";
import { Button } from "@/components/ui/Button";

const MAX_QTY = 10;

/** Quantity stepper + Add to cart (product page). */
export function AddToCart({
  productId,
  name,
  inStock,
  categoryId,
}: {
  productId: string;
  name: string;
  inStock: boolean;
  categoryId: CategoryId;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (!inStock) {
    return (
      <div className="rounded-xl bg-rice-dim p-4 text-sm">
        <p className="font-semibold">Sold out</p>
        <p className="text-soil/70">This batch has sold out. The farmer&apos;s next batch will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-full border border-husk/30 bg-white/80" role="group" aria-label="Quantity">
          <button
            type="button"
            className="h-11 w-11 rounded-full text-lg font-semibold text-field disabled:opacity-30"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-8 text-center font-semibold tabular-nums" aria-live="polite">
            {qty}
          </span>
          <button
            type="button"
            className="h-11 w-11 rounded-full text-lg font-semibold text-field disabled:opacity-30"
            onClick={() => setQty((q) => Math.min(MAX_QTY, q + 1))}
            disabled={qty >= MAX_QTY}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        <Button
          className="h-11 flex-1 px-8 sm:flex-none"
          onClick={(e) => {
            addItem(productId, qty);
            flyGrainsToCart(e.currentTarget, Math.min(10, 4 + qty * 2), categories[categoryId].particle);
            setAdded(true);
          }}
          aria-label={`Add ${qty} × ${name} to cart`}
        >
          Add to cart
        </Button>
      </div>
      {added && (
        <p className="text-sm text-field" role="status">
          Added to your cart.{" "}
          <Link href="/cart" className="font-semibold underline decoration-paddy underline-offset-4">
            View cart →
          </Link>
        </p>
      )}
    </div>
  );
}
