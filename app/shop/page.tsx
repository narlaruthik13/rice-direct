import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopView } from "@/components/shop/ShopView";
import { CategoryTabs } from "@/components/shop/CategoryTabs";

export const metadata: Metadata = {
  title: "Shop",
  description: "Rice and onions straight from farmers, processed by local partner mills and packhouses. Every pack is traceable.",
};

export default function ShopPage() {
  return (
    <div className="mx-auto max-w-site px-4 py-12 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-husk">Shop</p>
      <h1 className="mt-2 text-3xl font-semibold text-field sm:text-4xl">Straight from the farm</h1>
      <p className="mt-3 max-w-2xl text-soil/75">
        Every pack is one farmer&apos;s batch, named on the label and traceable to the field. Shop everything, or pick a
        crop for its own filters.
      </p>
      <CategoryTabs />

      {/* useSearchParams in ShopView needs a Suspense boundary for static rendering. */}
      <Suspense fallback={<p className="mt-8 text-sm text-soil/60">Loading…</p>}>
        <ShopView />
      </Suspense>
    </div>
  );
}
