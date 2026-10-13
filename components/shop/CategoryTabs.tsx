import Link from "next/link";
import type { CategoryId } from "@/lib/types";
import { categoryList } from "@/lib/categories";
import { products, productsIn } from "@/data/mock";

/** All / Rice / Onions ... pills at the top of every shop page (from lib/categories.ts). */
export function CategoryTabs({ active }: { active?: CategoryId }) {
  const tabs = [
    { href: "/shop", label: "All", count: products.length, current: !active },
    ...categoryList.map((c) => ({
      href: `/shop/${c.slug}`,
      label: c.name,
      count: productsIn(c.id).length,
      current: active === c.id,
    })),
  ];

  return (
    <nav aria-label="Shop categories" className="mt-6">
      <ul className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <li key={t.href}>
            <Link
              href={t.href}
              aria-current={t.current ? "page" : undefined}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                t.current ? "bg-field text-rice" : "bg-white/70 text-soil/80 ring-1 ring-husk/20 hover:text-field"
              }`}
            >
              {t.label}
              <span className={`text-xs ${t.current ? "text-rice/70" : "text-soil/50"}`}>{t.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
