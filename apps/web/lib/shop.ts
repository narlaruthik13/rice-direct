// Shop filters, kept in the URL: ?type=STEAM&variety=sona-masoori,hmt&age=AGED&pack=10,25&sort=price-asc
import type { Product, RiceAge, RiceType } from "@kisa/shared";

export type SortKey = "featured" | "price-asc" | "price-desc";

export interface ShopFilters {
  /** The type tab; null = all types. */
  type: RiceType | null;
  /** Variety slugs; empty = all. */
  varieties: string[];
  age: RiceAge | null;
  /** Pack sizes in kg; empty = all. */
  packs: number[];
  sort: SortKey;
}

export const EMPTY_FILTERS: ShopFilters = { type: null, varieties: [], age: null, packs: [], sort: "featured" };

const TYPES: RiceType[] = ["RAW", "STEAM", "BOILED"];
const AGES: RiceAge[] = ["NEW", "AGED"];
const SORTS: SortKey[] = ["featured", "price-asc", "price-desc"];

const list = (v: string | null) => (v ? v.split(",").filter(Boolean) : []);

export function parseFilters(params: URLSearchParams): ShopFilters {
  const type = params.get("type") as RiceType | null;
  const age = params.get("age") as RiceAge | null;
  const sort = params.get("sort") as SortKey | null;
  return {
    type: type && TYPES.includes(type) ? type : null,
    varieties: list(params.get("variety")),
    age: age && AGES.includes(age) ? age : null,
    packs: list(params.get("pack")).map(Number).filter((n) => Number.isInteger(n) && n > 0),
    sort: sort && SORTS.includes(sort) ? sort : "featured",
  };
}

export function toQuery(f: ShopFilters): string {
  const q = new URLSearchParams();
  if (f.type) q.set("type", f.type);
  if (f.varieties.length) q.set("variety", f.varieties.join(","));
  if (f.age) q.set("age", f.age);
  if (f.packs.length) q.set("pack", f.packs.join(","));
  if (f.sort !== "featured") q.set("sort", f.sort);
  return q.toString();
}

/** Filters other than the type tab and sort (the tab has its own control). */
export const activeFilterCount = (f: ShopFilters) => f.varieties.length + (f.age ? 1 : 0) + f.packs.length;

export function applyFilters(products: Product[], f: ShopFilters): Product[] {
  const out = products.filter(
    (p) =>
      (!f.type || p.riceType === f.type) &&
      (!f.varieties.length || f.varieties.includes(p.variety.slug)) &&
      (!f.age || p.age === f.age) &&
      (!f.packs.length || f.packs.includes(p.bagSizeKg)),
  );
  if (f.sort === "price-asc") return [...out].sort((a, b) => a.price - b.price);
  if (f.sort === "price-desc") return [...out].sort((a, b) => b.price - a.price);
  // Featured first, in-stock before sold out, otherwise catalogue order.
  return [...out].sort((a, b) => Number(b.featured) - Number(a.featured) || Number(b.inStock) - Number(a.inStock));
}
