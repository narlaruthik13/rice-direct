import type { Metadata } from "next";
import { Suspense } from "react";
import { getProducts, getVarieties, load } from "@/lib/data";
import { ShopView } from "@/components/shop/ShopView";
import { CatalogueUnavailable } from "@/components/ui/CatalogueUnavailable";

export const metadata: Metadata = {
  title: "Shop rice",
  description: "Mill-fresh rice, honestly priced. Raw, steam and boiled rice packed in Kisa bags, each with its own Quality Passport.",
};

export default async function ShopPage() {
  // Every product on sale; the type tabs and filters narrow it in the browser (instant, no extra requests).
  const catalogue = await load(() => Promise.all([getProducts(), getVarieties()]));

  return (
    <div className="mx-auto max-w-site px-4 py-12 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-husk">Shop</p>
      <h1 className="mt-2 text-3xl font-semibold text-field sm:text-4xl">Mill-fresh rice, honestly priced</h1>
      <p className="mt-3 max-w-2xl text-soil/75">
        Every bag is milled fresh, checked by Kisa and packed in a Kisa bag with a QR code to its Quality Passport. Pick a type,
        then narrow by variety, age and pack size.
      </p>

      {catalogue.ok ? (
        // useSearchParams in ShopView needs a Suspense boundary for static rendering.
        <Suspense fallback={<p className="mt-8 text-sm text-soil/60">Loading…</p>}>
          <ShopView products={catalogue.data[0]} varieties={catalogue.data[1]} />
        </Suspense>
      ) : (
        <CatalogueUnavailable retryHref="/shop" className="mt-8" />
      )}
    </div>
  );
}
