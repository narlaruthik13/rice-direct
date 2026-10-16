import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutView } from "@/components/checkout/CheckoutView";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-site px-4 py-12 sm:px-6">
      <Link href="/cart" className="inline-block py-2 text-sm text-soil/60 hover:text-field">
        ← Back to cart
      </Link>
      <h1 className="mt-3 text-3xl font-semibold text-field sm:text-4xl">Checkout</h1>
      <CheckoutView />
    </div>
  );
}
