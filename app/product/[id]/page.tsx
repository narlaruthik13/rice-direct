import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBatch, getFarmer, getMill, getProduct, products } from "@/data/mock";
import { formatINR } from "@/lib/format";
import { RiceBag } from "@/components/product/RiceBag";
import { PriceBreakdown } from "@/components/product/PriceBreakdown";
import { AddToCart } from "@/components/product/AddToCart";
import { BatchStory } from "@/components/product/BatchStory";
import { QualityReport } from "@/components/product/QualityReport";
import { FarmerCard, MillCard } from "@/components/product/Partners";
import { ProductCard } from "@/components/product/ProductCard";

interface Props {
  params: { id: string };
}

// Pre-render every product; unknown ids 404.
export const dynamicParams = false;
export function generateStaticParams() {
  return products.map((p) => ({ id: p.id }));
}

export function generateMetadata({ params }: Props): Metadata {
  const product = getProduct(params.id);
  if (!product) return {};
  const farmer = getFarmer(product.farmerId);
  return {
    title: `${product.name} (${product.bagSizeKg} kg)`,
    description: `${product.description} Grown by ${farmer?.name}. Batch ${product.batchId}.`,
  };
}

function Section({ title, eyebrow, children }: { title: string; eyebrow: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-white/70 p-6 shadow-card ring-1 ring-husk/10 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-husk">{eyebrow}</p>
      <h2 className="mt-1 text-2xl font-semibold text-field">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default function ProductPage({ params }: Props) {
  const product = getProduct(params.id);
  const farmer = product && getFarmer(product.farmerId);
  const mill = product && getMill(product.millId);
  const batch = product && getBatch(product.batchId);
  if (!product || !farmer || !mill || !batch) notFound();

  const moreFromFarmer = products.filter((p) => p.farmerId === farmer.id && p.id !== product.id);

  return (
    <div className="mx-auto max-w-site px-4 py-10 sm:px-6">
      <nav aria-label="Breadcrumb" className="text-sm text-soil/60">
        <Link href="/shop" className="hover:text-field">
          Shop
        </Link>
        <span className="mx-2" aria-hidden="true">
          /
        </span>
        <span className="text-soil">{product.name}</span>
      </nav>

      {/* Top: bag + buy box */}
      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div className="relative grid aspect-square place-items-center rounded-3xl bg-rice-dim">
          <RiceBag
            farmerName={farmer.name}
            variety={product.variety}
            weightKg={product.bagSizeKg}
            batchId={product.batchId}
            aged={product.age === "aged"}
            className="h-[78%] w-auto drop-shadow-xl"
          />
          <span
            className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold text-rice ${
              product.age === "aged" ? "bg-husk" : "bg-field"
            }`}
          >
            {product.age === "aged" ? "Aged" : "New crop"}
          </span>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-husk">
            {product.variety} · {product.bagSizeKg} kg bag
          </p>
          <h1 className="mt-2 text-4xl font-semibold text-field">{product.name}</h1>
          <p className="mt-2 text-soil/75">
            Grown by <span className="font-semibold text-soil">{farmer.name}</span> in {farmer.village}, {farmer.district} ·
            milled at {mill.name}
          </p>

          <ul className="mt-4 flex flex-wrap gap-2">
            {product.tags.map((t) => (
              <li key={t} className="rounded-full bg-rice-dim px-3 py-1 text-xs font-medium">
                {t}
              </li>
            ))}
          </ul>

          <p className="mt-5 leading-relaxed text-soil/85">{product.description}</p>

          <div className="mt-6 flex items-baseline gap-3">
            <span className="font-display text-4xl font-semibold">{formatINR(product.price)}</span>
            <span className="text-sm text-soil/60">
              {formatINR(Math.round(product.price / product.bagSizeKg))}/kg · incl. all fees
            </span>
          </div>

          <div className="mt-5">
            <AddToCart productId={product.id} name={product.name} inStock={product.inStock} />
          </div>

          <div className="mt-8 rounded-2xl bg-white/70 p-5 shadow-card ring-1 ring-husk/10">
            <h2 className="font-sans text-sm font-semibold">Where your {formatINR(product.price)} goes</h2>
            <div className="mt-4">
              <PriceBreakdown breakdown={product.priceBreakdown} price={product.price} />
            </div>
          </div>
        </div>
      </div>

      {/* Story, people, quality */}
      <div className="mt-14 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <Section eyebrow="Batch story" title="From field to this bag">
          <BatchStory batch={batch} farmer={farmer} mill={mill} />
        </Section>
        <Section eyebrow="Quality report" title="Tested before packing">
          <QualityReport quality={batch.quality} />
        </Section>
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <FarmerCard farmer={farmer} />
        <MillCard mill={mill} />
      </div>

      {moreFromFarmer.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-semibold text-field">More from {farmer.name}</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {moreFromFarmer.map((p) => (
              <div key={p.id} className="flex">
                <ProductCard product={p} farmer={farmer} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
