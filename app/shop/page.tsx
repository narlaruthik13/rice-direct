import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopView } from "@/components/shop/ShopView";

export const metadata: Metadata = {
  title: "Shop rice",
  description: "Rice straight from farmers, milled by local partner mills. Filter by variety, farm, price and age.",
};

export default function ShopPage() {
  return (
    <div className="mx-auto max-w-site px-4 py-12 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-husk">Shop</p>
      <h1 className="mt-2 text-3xl font-semibold text-field sm:text-4xl">Rice, straight from the farm</h1>
      <p className="mt-3 max-w-2xl text-soil/75">
        Every bag is one farmer&apos;s batch, milled for a fee by a partner mill. Pick by variety, farm, price, or whether
        you like it new or aged.
      </p>

      {/* useSearchParams in ShopView needs a Suspense boundary for static rendering. */}
      <Suspense fallback={<p className="mt-8 text-sm text-soil/60">Loading rice…</p>}>
        <ShopView />
      </Suspense>
    </div>
  );
}
