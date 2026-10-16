import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";
import { CatalogueUnavailable } from "@/components/ui/CatalogueUnavailable";
import { getProducts, load } from "@/lib/data";

export const metadata: Metadata = {
  title: "Your cart",
  robots: { index: false },
};

export default async function CartPage() {
  // Current prices and stock for the items saved in the browser's cart.
  const catalogue = await load(() => getProducts());
  return (
    <div className="mx-auto max-w-site px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold text-field sm:text-4xl">Your cart</h1>
      {catalogue.ok ? <CartView products={catalogue.data} /> : <CatalogueUnavailable retryHref="/cart" className="mt-10" />}
    </div>
  );
}
