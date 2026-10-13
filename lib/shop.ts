// Shop filtering. Filters live in the URL (?variety=…&farm=…&age=…&max=…&sort=…)
// so filtered views can be shared and the footer can link to /shop?age=aged.

import type { Product, RiceAge } from "@/lib/types";

export type SortKey = "featured" | "price-asc" | "price-desc";

export interface ShopFilters {
  varieties: string[];
  farms: string[]; // farmer ids
  age: RiceAge | "all";
  maxPrice: number | null;
  sort: SortKey;
}

export const PRICE_STEP = 50;

const list = (value: string | null) => (value ? value.split(",").filter(Boolean) : []);

export function parseFilters(params: { get(name: string): string | null }): ShopFilters {
  const age = params.get("age");
  const sort = params.get("sort");
  const max = Number(params.get("max"));
  return {
    varieties: list(params.get("variety")),
    farms: list(params.get("farm")),
    age: age === "new" || age === "aged" ? age : "all",
    maxPrice: Number.isFinite(max) && max > 0 ? max : null,
    sort: sort === "price-asc" || sort === "price-desc" ? sort : "featured",
  };
}

export function toQuery(f: ShopFilters) {
  const q = new URLSearchParams();
  if (f.varieties.length) q.set("variety", f.varieties.join(","));
  if (f.farms.length) q.set("farm", f.farms.join(","));
  if (f.age !== "all") q.set("age", f.age);
  if (f.maxPrice !== null) q.set("max", String(f.maxPrice));
  if (f.sort !== "featured") q.set("sort", f.sort);
  return q.toString();
}

export function applyFilters(products: Product[], f: ShopFilters) {
  const result = products.filter(
    (p) =>
      (!f.varieties.length || f.varieties.includes(p.variety)) &&
      (!f.farms.length || f.farms.includes(p.farmerId)) &&
      (f.age === "all" || p.age === f.age) &&
      (f.maxPrice === null || p.price <= f.maxPrice),
  );
  if (f.sort === "price-asc") return result.sort((a, b) => a.price - b.price);
  if (f.sort === "price-desc") return result.sort((a, b) => b.price - a.price);
  // Featured first, then in-stock before sold out; otherwise keep catalogue order.
  return result.sort((a, b) => Number(b.featured) - Number(a.featured) || Number(b.inStock) - Number(a.inStock));
}

export const activeFilterCount = (f: ShopFilters) =>
  f.varieties.length + f.farms.length + (f.age !== "all" ? 1 : 0) + (f.maxPrice !== null ? 1 : 0);

/** Slider bounds, rounded out to PRICE_STEP. */
export function priceBounds(products: Product[]) {
  const prices = products.map((p) => p.price);
  return {
    min: Math.floor(Math.min(...prices) / PRICE_STEP) * PRICE_STEP,
    max: Math.ceil(Math.max(...prices) / PRICE_STEP) * PRICE_STEP,
  };
}
