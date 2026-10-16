import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, getProducts, load, staticProductSlugs } from "@/lib/data";
import { formatDate, formatINR } from "@/lib/format";
import { ageLabel, cookingNotes, typeLabel } from "@/lib/rice";
import { AddToCart } from "@/components/product/AddToCart";
import { ProductCard } from "@/components/product/ProductCard";
import { QualityReport } from "@/components/product/QualityReport";
import { RiceBag } from "@/components/product/RiceBag";
import { CatalogueUnavailable } from "@/components/ui/CatalogueUnavailable";

interface Props {
  params: { id: string };
}

// Mock data: every product is pre-rendered. API: rendered on demand from cached data. Unknown slugs 404.
export function generateStaticParams() {
  return staticProductSlugs().map((id) => ({ id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const detail = await load(() => getProduct(params.id));
  if (!detail.ok || !detail.data) return {};
  const { product } = detail.data;
  return {
    title: `${product.name} (${product.bagSizeKg} kg)`,
    description: `${product.description} ${product.variety.name}, ${typeLabel(product.riceType).toLowerCase()} rice, ${ageLabel(product.age).toLowerCase()}. Batch ${product.batchId}.`,
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

export default async function ProductPage({ params }: Props) {
  const loaded = await load(async () => {
    const detail = await getProduct(params.id);
    return detail && { ...detail, sameVariety: await getProducts({ variety: detail.product.variety.slug }) };
  });
  if (!loaded.ok) {
    return (
      <div className="mx-auto max-w-site px-4 py-12 sm:px-6">
        <CatalogueUnavailable retryHref={`/product/${encodeURIComponent(params.id)}`} />
      </div>
    );
  }
  if (!loaded.data) notFound();
  const { product, passport, sameVariety } = loaded.data;
  const notes = cookingNotes(product.riceType, product.age);
  const aged = product.age === "AGED";
  const moreOfVariety = sameVariety.filter((p) => p.id !== product.id).slice(0, 3);

  const facts = [
    { label: "Variety", value: product.variety.name },
    { label: "Type", value: typeLabel(product.riceType) },
    { label: "Age", value: ageLabel(product.age) },
    { label: "Pack size", value: `${product.bagSizeKg} kg` },
  ];

  return (
    <div className="mx-auto max-w-site px-4 py-10 sm:px-6">
      <nav aria-label="Breadcrumb" className="text-sm text-soil/60">
        <Link href="/shop" className="inline-block py-2 hover:text-field">
          Shop
        </Link>
        <span className="mx-2" aria-hidden="true">
          /
        </span>
        <Link href={`/shop?type=${product.riceType}`} className="inline-block py-2 hover:text-field">
          {typeLabel(product.riceType)} rice
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
            variety={product.variety.name}
            typeLabel={typeLabel(product.riceType)}
            weightKg={product.bagSizeKg}
            batchId={product.batchId}
            aged={aged}
            className="h-[78%] w-auto drop-shadow-xl"
          />
          <span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold text-rice ${aged ? "bg-husk" : "bg-field"}`}>
            {ageLabel(product.age)}
          </span>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-husk">
            {product.variety.name} · {typeLabel(product.riceType)} · {product.bagSizeKg} kg bag
          </p>
          <h1 className="mt-2 text-4xl font-semibold text-field">{product.name}</h1>

          <ul className="mt-4 flex flex-wrap gap-2">
            {product.tags.map((t) => (
              <li key={t} className="rounded-full bg-rice-dim px-3 py-1 text-xs font-medium">
                {t}
              </li>
            ))}
          </ul>

          <p className="mt-5 leading-relaxed text-soil/85">{product.description}</p>

          <dl className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-white/60 p-4 ring-1 ring-husk/10 sm:grid-cols-4">
            {facts.map((f) => (
              <div key={f.label}>
                <dt className="text-[11px] uppercase tracking-wider text-soil/55">{f.label}</dt>
                <dd className="text-sm font-semibold">{f.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 flex items-baseline gap-3">
            <span className="font-display text-4xl font-semibold" data-testid="product-price">
              {formatINR(product.price)}
            </span>
            <span className="text-sm text-soil/60">{formatINR(Math.round(product.price / product.bagSizeKg))}/kg · honest, all-in price</span>
          </div>

          <div className="mt-5">
            <AddToCart productId={product.id} name={product.name} inStock={product.inStock} />
          </div>

          <p className="mt-6 text-sm text-soil/70">
            Milled {formatDate(passport.millingDate)} · packed {formatDate(passport.packedDate)} · best before {formatDate(passport.bestBefore)}.{" "}
            <Link href={`/trace/${product.batchId}`} className="font-semibold text-field underline decoration-paddy underline-offset-4">
              See the Quality Passport
            </Link>
          </p>
        </div>
      </div>

      {/* Cooking and quality */}
      <div className="mt-14 grid gap-8 lg:grid-cols-2">
        <Section eyebrow="Cooking notes" title={`Cooking ${aged ? "aged " : ""}${typeLabel(product.riceType).toLowerCase()} rice`}>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-soil/55">Water</dt>
              <dd className="mt-1 font-semibold">{notes.water}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-soil/55">Time</dt>
              <dd className="mt-1 font-semibold">{notes.time}</dd>
            </div>
          </dl>
          <ul className="mt-5 list-disc space-y-2 pl-5 text-soil/85">
            {notes.tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <p className="mt-5 text-sm text-soil/75">
            <span className="font-semibold text-soil">Best for:</span> {notes.bestFor}.
          </p>
        </Section>
        <Section eyebrow="Quality summary" title="Checked before packing">
          <QualityReport quality={passport.quality} />
        </Section>
      </div>

      {moreOfVariety.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-semibold text-field">More {product.variety.name}</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {moreOfVariety.map((p) => (
              <div key={p.id} className="flex">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
