"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { Product } from "@kisa/shared";
import { formatINR } from "@/lib/format";
import { flyGrainsToCart } from "@/lib/flyToCart";
import { ageLabel, typeLabel } from "@/lib/rice";
import { useCartStore } from "@/store/cart";
import { Button } from "@/components/ui/Button";
import { RiceBag } from "@/components/product/RiceBag";

// Card lifts and its shadow deepens on hover; the bag tilts as if picked up.
const SHADOW_REST = "0 1px 2px rgba(46,34,25,0.06), 0 8px 24px -12px rgba(46,34,25,0.18)";
const SHADOW_HOVER = "0 2px 4px rgba(46,34,25,0.08), 0 20px 40px -14px rgba(46,34,25,0.32)";
const cardVariants: Variants = {
  rest: { y: 0, boxShadow: SHADOW_REST },
  hover: { y: -6, boxShadow: SHADOW_HOVER },
};
const bagVariants: Variants = {
  rest: { y: 0, rotate: 0 },
  hover: { y: -6, rotate: -3 },
};
const spring = { type: "spring", stiffness: 300, damping: 22 } as const;

export function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  // Reduced motion: no hover lift (markup is identical, so no hydration mismatch).
  const reduce = useReducedMotion();
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1500);
    return () => clearTimeout(t);
  }, [added]);

  const href = `/product/${product.id}`;
  const aged = product.age === "AGED";

  return (
    <motion.article
      className="flex w-full flex-col overflow-hidden rounded-2xl bg-white/70 ring-1 ring-husk/10"
      variants={cardVariants}
      initial="rest"
      animate="rest"
      whileHover={reduce ? undefined : "hover"}
      transition={spring}
    >
      <Link href={href} className="relative grid aspect-[16/10] place-items-center bg-rice-dim sm:aspect-[4/3]" tabIndex={-1} aria-hidden="true">
        <motion.div variants={bagVariants} transition={spring} className="h-[86%]">
          <RiceBag variety={product.variety.name} typeLabel={typeLabel(product.riceType)} weightKg={product.bagSizeKg} batchId={product.batchId} aged={aged} className="h-full w-auto" />
        </motion.div>
        <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold ${aged ? "bg-husk text-rice" : "bg-field text-rice"}`}>
          {ageLabel(product.age)}
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-rice/90 px-2.5 py-1 text-xs font-semibold text-field ring-1 ring-field/20">
          {typeLabel(product.riceType)}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-husk">
          {product.variety.name} · {product.bagSizeKg} kg
        </p>
        <h3 className="mt-1 text-xl font-semibold text-field">
          <Link href={href} className="hover:underline hover:decoration-paddy hover:underline-offset-4">
            {product.name}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm text-soil/70">{product.description}</p>

        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <div>
            <span className="font-display text-2xl font-semibold">{formatINR(product.price)}</span>
            <span className="block text-xs text-soil/60">{formatINR(Math.round(product.price / product.bagSizeKg))}/kg</span>
          </div>
          <Button
            onClick={(e) => {
              addItem(product.id);
              flyGrainsToCart(e.currentTarget, 6);
              setAdded(true);
            }}
            disabled={!product.inStock}
            aria-label={product.inStock ? `Add ${product.name}, ${product.bagSizeKg} kg to cart` : `${product.name}, ${product.bagSizeKg} kg is sold out`}
          >
            {!product.inStock ? "Sold out" : added ? "Added ✓" : "Add to cart"}
          </Button>
        </div>
      </div>
    </motion.article>
  );
}
