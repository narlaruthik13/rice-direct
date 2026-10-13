import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { categoryList, getCategoryBySlug } from "@/lib/categories";
import { ShopView } from "@/components/shop/ShopView";
import { CategoryTabs } from "@/components/shop/CategoryTabs";
import { OnionStory } from "@/components/onion/OnionStory";
import { onionStoryBag } from "@/lib/onionStory";

// One static page per category in lib/categories.ts: /shop/rice, /shop/onions, ...
interface Props {
  params: { category: string };
}

export const dynamicParams = false;
export function generateStaticParams() {
  return categoryList.map((c) => ({ category: c.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const category = getCategoryBySlug(params.category);
  if (!category) return {};
  return { title: `Shop ${category.name.toLowerCase()}`, description: `${category.tagline}. ${category.shopIntro}` };
}

export default function CategoryShopPage({ params }: Props) {
  const category = getCategoryBySlug(params.category);
  if (!category) notFound();

  return (
    <>
      <div className="mx-auto max-w-site px-4 pt-12 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: category.theme.accent }}>
          Shop {category.name.toLowerCase()}
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-field sm:text-4xl">{category.tagline}</h1>
        <p className="mt-3 max-w-2xl text-soil/75">{category.shopIntro}</p>
        <CategoryTabs active={category.id} />
      </div>

      {/* Category story (full width), above the products */}
      {category.id === "onions" && (
        <div className="mt-10">
          <OnionStory bag={onionStoryBag()} skipTo="#shop-grid" />
        </div>
      )}

      <div id="shop-grid" className="mx-auto max-w-site scroll-mt-20 px-4 pb-12 sm:px-6">
        <Suspense fallback={<p className="mt-8 text-sm text-soil/60">Loading…</p>}>
          <ShopView categoryId={category.id} />
        </Suspense>
      </div>
    </>
  );
}
