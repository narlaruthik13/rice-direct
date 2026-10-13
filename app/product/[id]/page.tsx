import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBatch, getFarmer, getPartner, getProduct, products } from "@/data/mock";
import { attributeValues, categories, PARTNER_TYPES, productBadge } from "@/lib/categories";
import { SalesModelBadge } from "@/components/product/SalesModelBadge";
import { formatDate, formatINR } from "@/lib/format";
import { ProducePack } from "@/components/product/ProducePack";
import { PriceBreakdown } from "@/components/product/PriceBreakdown";
import { AddToCart } from "@/components/product/AddToCart";
import { BatchStory } from "@/components/product/BatchStory";
import { QualityReport } from "@/components/product/QualityReport";
import { FarmerCard, PartnerCard } from "@/components/product/Partners";
import { ProductCard } from "@/components/product/ProductCard";

interface Props {
  params: { id: string };
}

// Pre-render every product in every category; unknown ids 404.
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
  const partner = product && getPartner(product.partnerId);
  const batch = product && getBatch(product.batchId);
  if (!product || !farmer || !partner || !batch) notFound();

  const category = categories[product.categoryId];
  const badge = productBadge(product);
  const attributes = attributeValues(product.categoryId, [product, batch, batch.quality]);
  const moreFromFarmer = products.filter((p) => p.farmerId === farmer.id && p.id !== product.id);

  return (
    <div className="mx-auto max-w-site px-4 py-10 sm:px-6">
      <nav aria-label="Breadcrumb" className="text-sm text-soil/60">
        <Link href="/shop" className="inline-block py-2 hover:text-field">
          Shop
        </Link>
        <span className="mx-2" aria-hidden="true">
          /
        </span>
        <Link href={`/shop/${category.slug}`} className="inline-block py-2 hover:text-field">
          {category.name}
        </Link>
        <span className="mx-2" aria-hidden="true">
          /
        </span>
        <span className="text-soil">{product.name}</span>
      </nav>

      {/* Top: pack + buy box */}
      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div className="relative grid aspect-square place-items-center rounded-3xl bg-rice-dim">
          <ProducePack product={product} farmerName={farmer.name} className="h-[78%] w-auto drop-shadow-xl" />
          <span
            className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold text-rice ${
              badge.tone === "husk" ? "bg-husk" : "bg-field"
            }`}
          >
            {badge.label}
          </span>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-husk">
              {product.variety} · {product.bagSizeKg} kg {category.pack.noun}
            </p>
            <SalesModelBadge model={product.salesModel} categoryId={product.categoryId} size="md" />
          </div>
          <h1 className="mt-2 text-4xl font-semibold text-field">{product.name}</h1>
          <p className="mt-2 text-soil/75">
            Grown by <span className="font-semibold text-soil">{farmer.name}</span> in {farmer.village}, {farmer.district} ·{" "}
            {PARTNER_TYPES[partner.type].verb} {partner.name}
          </p>

          {/* What the sales-model badge means for this specific lot */}
          <p className="mt-3 rounded-xl bg-white/60 px-4 py-2.5 text-sm text-soil/80 ring-1 ring-husk/10">
            {product.salesModel === "FARMER_OWNED"
              ? `${farmer.name} owns ${category.nouns.this} and pays ${partner.name} ₹${partner.processingFeePerKg}/kg to process it.`
              : `${partner.name} bought this lot from ${farmer.name}${
                  batch.purchase ? ` on ${formatDate(batch.purchase.date)} at ₹${batch.purchase.pricePerKg}/kg ${category.nouns.raw}` : ""
                }, then processed and packed it.`}
          </p>

          <ul className="mt-4 flex flex-wrap gap-2">
            {product.tags.map((t) => (
              <li key={t} className="rounded-full bg-rice-dim px-3 py-1 text-xs font-medium">
                {t}
              </li>
            ))}
          </ul>

          <p className="mt-5 leading-relaxed text-soil/85">{product.description}</p>

          {/* Category attributes, straight from lib/categories.ts */}
          <dl className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-white/60 p-4 ring-1 ring-husk/10 sm:grid-cols-4">
            {attributes.map((a) => (
              <div key={a.key}>
                <dt className="text-[11px] uppercase tracking-wider text-soil/55">{a.label}</dt>
                <dd className="text-sm font-semibold">{a.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 flex items-baseline gap-3">
            <span className="font-display text-4xl font-semibold">{formatINR(product.price)}</span>
            <span className="text-sm text-soil/60">
              {formatINR(Math.round(product.price / product.bagSizeKg))}/kg · incl. all fees
            </span>
          </div>

          <div className="mt-5">
            <AddToCart productId={product.id} name={product.name} inStock={product.inStock} categoryId={product.categoryId} />
          </div>

          <div className="mt-8 rounded-2xl bg-white/70 p-5 shadow-card ring-1 ring-husk/10">
            <h2 className="font-sans text-sm font-semibold">Where your {formatINR(product.price)} goes</h2>
            <div className="mt-4">
              <PriceBreakdown
                breakdown={product.priceBreakdown}
                price={product.price}
                categoryId={product.categoryId}
                purchase={batch.purchase}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Story, people, quality */}
      <div className="mt-14 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <Section eyebrow="Batch story" title={`From field to this ${category.pack.noun}`}>
          <BatchStory batch={batch} farmer={farmer} partner={partner} product={product} />
        </Section>
        <Section eyebrow="Quality report" title="Tested before packing">
          <QualityReport batch={batch} />
        </Section>
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <FarmerCard farmer={farmer} product={product} />
        <PartnerCard partner={partner} product={product} />
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
