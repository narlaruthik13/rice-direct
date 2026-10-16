"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { Product, RiceType, Variety } from "@kisa/shared";
import { activeFilterCount, applyFilters, EMPTY_FILTERS, parseFilters, toQuery, type ShopFilters as Filters, type SortKey } from "@/lib/shop";
import { PACK_SIZES, RICE_TYPES, TYPE_INTRO, typeLabel } from "@/lib/rice";
import { ProductCard } from "@/components/product/ProductCard";
import { ShopFilters } from "@/components/shop/ShopFilters";
import { Button } from "@/components/ui/Button";

/** Browse by type (tabs), then narrow by variety, age and pack size. The page loads the data on the server. */
export function ShopView({ products, varieties }: { products: Product[]; varieties: Variety[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [panelOpen, setPanelOpen] = useState(false);

  // The URL is the single source of truth for filters.
  const filters = useMemo(() => parseFilters(params), [params]);
  const results = useMemo(() => applyFilters(products, filters), [products, filters]);
  const activeCount = activeFilterCount(filters);

  const setFilters = (next: Filters) => {
    const q = toQuery(next);
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  };
  const update = (patch: Partial<Filters>) => setFilters({ ...filters, ...patch });
  const clear = () => setFilters({ ...EMPTY_FILTERS, type: filters.type, sort: filters.sort });

  const tabs: { value: RiceType | null; label: string }[] = [{ value: null, label: "All rice" }, ...RICE_TYPES.map((t) => ({ value: t, label: typeLabel(t) }))];
  const filterPanel = <ShopFilters filters={filters} update={update} onClear={clear} varieties={varieties} packSizes={PACK_SIZES} />;

  return (
    <div className="mt-8">
      <div role="tablist" aria-label="Rice type" className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const active = filters.type === tab.value;
          return (
            <button
              key={tab.label}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => update({ type: tab.value })}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                active ? "bg-field text-rice shadow-sm" : "bg-white/70 text-soil/80 ring-1 ring-husk/15 hover:text-field"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <p className="mt-3 max-w-2xl text-sm text-soil/75" aria-live="polite">
        {filters.type ? TYPE_INTRO[filters.type] : "Raw, steam and boiled rice, milled fresh and packed in Kisa bags."}
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl bg-white/70 p-5 shadow-card ring-1 ring-husk/10">{filterPanel}</div>
        </aside>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setPanelOpen((o) => !o)}
              aria-expanded={panelOpen}
              aria-controls="mobile-filters"
              className="inline-flex items-center gap-2 rounded-full border border-field/30 px-4 py-2 text-sm font-semibold text-field lg:hidden"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
              </svg>
              Filters{activeCount > 0 && ` (${activeCount})`}
            </button>

            <p className="text-sm text-soil/70" aria-live="polite">
              {results.length} {results.length === 1 ? "pack" : "packs"}
            </p>

            <label className="flex items-center gap-2 text-sm">
              <span className="text-soil/70">Sort</span>
              <select
                value={filters.sort}
                onChange={(e) => update({ sort: e.target.value as SortKey })}
                className="rounded-full border border-husk/25 bg-white/80 px-3 py-1.5 text-sm font-medium focus:outline-none"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
              </select>
            </label>
          </div>

          {/* Mobile filter panel */}
          <AnimatePresence initial={false}>
            {panelOpen && (
              <motion.div
                id="mobile-filters"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden lg:hidden"
              >
                <div className="mt-4 rounded-2xl bg-white/70 p-5 shadow-card ring-1 ring-husk/10">{filterPanel}</div>
              </motion.div>
            )}
          </AnimatePresence>

          {results.length > 0 ? (
            <motion.ul layout className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {results.map((product) => (
                  <motion.li
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.25 }}
                    className="flex"
                  >
                    <ProductCard product={product} />
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ul>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-husk/30 p-10 text-center">
              <p className="font-display text-xl text-field">No rice matches these filters.</p>
              <p className="mt-2 text-sm text-soil/70">Try another type or fewer filters.</p>
              <Button variant="secondary" className="mt-5" onClick={clear}>
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
