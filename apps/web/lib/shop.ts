// Shop filtering. Filters live in the URL so filtered views can be shared:
//   /shop?variety=…&farm=…&sold=…&max=…&sort=…          (all categories)
//   /shop/rice?age=aged   /shop/onions?size=large        (+ category filters from lib/categories.ts)

import type { CategoryFilterDef, Product } from "@kisa/shared";

export type SortKey = "featured" | "price-asc" | "price-desc";

/** "Sold by": farmer = FARMER_OWNED, partner = PARTNER_SOURCED. */
export type SoldBy = "all" | "farmer" | "partner";

export interface ShopFilters {
  varieties: string[];
  farms: string[]; // farmer ids
  /** Category-specific filters, keyed by URL param (e.g. { age: "aged" }). */
  attrs: Record<string, string>;
  soldBy: SoldBy;
  maxPrice: number | null;
  sort: SortKey;
}

export const EMPTY_FILTERS: ShopFilters = {
  varieties: [],
  farms: [],
  attrs: {},
  soldBy: "all",
  maxPrice: null,
  sort: "featured",
};

export const PRICE_STEP = 50;

const list = (value: string | null) => (value ? value.split(",").filter(Boolean) : []);

export function parseFilters(params: { get(name: string): string | null }, defs: CategoryFilterDef[] = []): ShopFilters {
  const sort = params.get("sort");
  const sold = params.get("sold");
  const max = Number(params.get("max"));
  const attrs: Record<string, string> = {};
  for (const def of defs) {
    const value = params.get(def.param);
    if (value && def.options.some((o) => o.value === value)) attrs[def.param] = value;
  }
  return {
    varieties: list(params.get("variety")),
    farms: list(params.get("farm")),
    attrs,
    soldBy: sold === "farmer" || sold === "partner" ? sold : "all",
    maxPrice: Number.isFinite(max) && max > 0 ? max : null,
    sort: sort === "price-asc" || sort === "price-desc" ? sort : "featured",
  };
}

export function toQuery(f: ShopFilters) {
  const q = new URLSearchParams();
  if (f.varieties.length) q.set("variety", f.varieties.join(","));
  if (f.farms.length) q.set("farm", f.farms.join(","));
  for (const [param, value] of Object.entries(f.attrs)) q.set(param, value);
  if (f.soldBy !== "all") q.set("sold", f.soldBy);
  if (f.maxPrice !== null) q.set("max", String(f.maxPrice));
  if (f.sort !== "featured") q.set("sort", f.sort);
  return q.toString();
}

export function applyFilters(products: Product[], f: ShopFilters, defs: CategoryFilterDef[] = []) {
  const result = products.filter((p) => {
    const fields = p as unknown as Record<string, unknown>;
    return (
      (!f.varieties.length || f.varieties.includes(p.variety)) &&
      (!f.farms.length || f.farms.includes(p.farmerId)) &&
      defs.every((def) => f.attrs[def.param] === undefined || fields[def.key] === f.attrs[def.param]) &&
      (f.soldBy === "all" || (f.soldBy === "farmer") === (p.salesModel === "FARMER_OWNED")) &&
      (f.maxPrice === null || p.price <= f.maxPrice)
    );
  });
  if (f.sort === "price-asc") return result.sort((a, b) => a.price - b.price);
  if (f.sort === "price-desc") return result.sort((a, b) => b.price - a.price);
  // Featured first, then in-stock before sold out; otherwise keep catalogue order.
  return result.sort((a, b) => Number(b.featured) - Number(a.featured) || Number(b.inStock) - Number(a.inStock));
}

export const activeFilterCount = (f: ShopFilters) =>
  f.varieties.length +
  f.farms.length +
  Object.keys(f.attrs).length +
  (f.soldBy !== "all" ? 1 : 0) +
  (f.maxPrice !== null ? 1 : 0);

/** Slider bounds, rounded out to PRICE_STEP. */
export function priceBounds(products: Product[]) {
  const prices = products.map((p) => p.price);
  return {
    min: Math.floor(Math.min(...prices) / PRICE_STEP) * PRICE_STEP,
    max: Math.ceil(Math.max(...prices) / PRICE_STEP) * PRICE_STEP,
  };
}
