"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { loadOrder, type OrderSnapshot } from "@/lib/order";
import { formatINR } from "@/lib/format";
import { buttonClasses } from "@/components/ui/Button";

function SuccessMark() {
  const reduce = useReducedMotion();
  return (
    <svg viewBox="0 0 52 52" className="h-16 w-16" aria-hidden="true">
      <motion.circle
        cx="26" cy="26" r="24" fill="none" stroke="#2F4A2A" strokeWidth="3"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
      <motion.path
        d="M15 27l7 7 15-16" fill="none" stroke="#D4A62A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.35, delay: 0.45, ease: "easeOut" }}
      />
    </svg>
  );
}

export function OrderSuccess() {
  // undefined = not read yet; null = nothing saved (e.g. opened directly).
  const [order, setOrder] = useState<OrderSnapshot | null | undefined>(undefined);
  useEffect(() => setOrder(loadOrder()), []);

  if (order === undefined) return <p className="text-sm text-soil/60">Loading your order…</p>;

  if (order === null) {
    return (
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-field">No recent order found</h1>
        <p className="mt-3 text-soil/70">Orders placed in this browser tab show up here.</p>
        <Link href="/shop" className={buttonClasses("primary", "mt-6")}>
          Shop now
        </Link>
      </div>
    );
  }

  const a = order.address;

  return (
    <div>
      <div className="flex flex-col items-center text-center">
        <SuccessMark />
        <h1 className="mt-4 text-3xl font-semibold text-field sm:text-4xl">Thank you, {a.name.split(" ")[0]}!</h1>
        <p className="mt-2 text-soil/75">
          Your Kisa order <span className="font-mono font-semibold">{order.id}</span> is placed. It&apos;s mill-fresh rice in Kisa bags,
          and every bag has its own Quality Passport.
        </p>
        <p className="mt-3 rounded-full bg-paddy/15 px-4 py-1.5 text-xs font-medium text-husk-dark">
          Demo order: no payment was taken ({order.paymentMethod} selected).
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl bg-white/70 p-6 shadow-card ring-1 ring-husk/10">
          <h2 className="text-xl font-semibold text-field">Your packs</h2>
          <ul className="mt-4 divide-y divide-husk/10">
            {order.items.map((item) => (
              <li key={item.productId} className="py-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span>
                    <span className="font-medium">{item.name}</span> × {item.quantity}
                    <span className="block text-xs text-soil/60">
                      {item.bagSizeKg} kg · {item.variety}
                    </span>
                  </span>
                  <span className="tabular-nums">{formatINR(item.price * item.quantity)}</span>
                </div>
                <Link
                  href={`/trace/${item.batchId}`}
                  className="mt-1.5 inline-block text-xs font-semibold text-field underline decoration-paddy underline-offset-4"
                >
                  Quality Passport for {item.batchId} →
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl bg-white/70 p-6 shadow-card ring-1 ring-husk/10">
            <h2 className="text-xl font-semibold text-field">Total paid</h2>
            <p className="mt-3 font-display text-3xl font-semibold">{formatINR(order.totals.price)}</p>
            <p className="mt-1 text-sm text-soil/70">One honest price for every bag. Delivery free in the demo.</p>
          </section>
          <section className="rounded-2xl bg-white/70 p-6 shadow-card ring-1 ring-husk/10 text-sm">
            <h2 className="text-xl font-semibold text-field">Delivering to</h2>
            <address className="mt-3 not-italic leading-relaxed text-soil/80">
              {a.name}
              <br />
              {a.line1}
              {a.line2 && (
                <>
                  <br />
                  {a.line2}
                </>
              )}
              <br />
              {a.city}, {a.state} {a.pin}
              <br />
              +91 {a.phone}
            </address>
          </section>
        </div>
      </div>

      <div className="mt-10 text-center">
        <Link href="/shop" className={buttonClasses("primary")}>
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
