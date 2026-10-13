import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { batches, getBatch, getFarmer, getPartner, products } from "@/data/mock";
import { categories, PARTNER_TYPES, STEP_DONE } from "@/lib/categories";
import { buildJourney, stepDate } from "@/lib/journey";
import { farmerAmount } from "@/lib/pricing";
import { formatDate } from "@/lib/format";
import { ProducePack } from "@/components/product/ProducePack";
import { SalesModelBadge } from "@/components/product/SalesModelBadge";
import { PriceBreakdown } from "@/components/product/PriceBreakdown";
import { TraceTimeline } from "@/components/trace/TraceTimeline";
import { buttonClasses } from "@/components/ui/Button";

// The page a pack's QR code opens. One static page per batch, any category;
// unknown ids 404. The journey (steps + sales model) comes from lib/journey.ts.

interface Props {
  params: { batchId: string };
}

export const dynamicParams = false;
export function generateStaticParams() {
  return batches.map((b) => ({ batchId: b.id }));
}

export function generateMetadata({ params }: Props): Metadata {
  const batch = getBatch(params.batchId);
  if (!batch) return {};
  const farmer = getFarmer(batch.farmerId);
  const { product } = categories[batch.categoryId].nouns;
  return {
    title: `Trace batch ${batch.id}`,
    description: `${batch.variety} ${product} grown by ${farmer?.name} in ${farmer?.village}. Harvest, processing and quality details for batch ${batch.id}.`,
  };
}

export default function TracePage({ params }: Props) {
  const batch = getBatch(params.batchId);
  const farmer = batch && getFarmer(batch.farmerId);
  const partner = batch && getPartner(batch.partnerId);
  if (!batch || !farmer || !partner) notFound();

  const category = categories[batch.categoryId];
  const product = products.find((p) => p.batchId === batch.id);
  const stages = buildJourney({ batch, farmer, partner, product, full: true });
  const firstProcess = category.steps.find((s) => s !== "harvest" && s !== "packing");
  const processedOn = firstProcess && stepDate(batch, firstProcess);
  const farmerOwned = batch.salesModel === "FARMER_OWNED";

  const summary = [
    { label: STEP_DONE.harvest, value: formatDate(batch.harvestDate) },
    ...(firstProcess && processedOn ? [{ label: STEP_DONE[firstProcess], value: formatDate(processedOn) }] : []),
    { label: "Grade", value: batch.quality.grade },
    {
      label: farmerOwned ? "To farmer" : "Paid to farmer",
      value: product ? `${Math.round((farmerAmount(product.priceBreakdown) / product.price) * 100)}%` : "—",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      {/* Summary card */}
      <header className="grid items-center gap-6 rounded-3xl bg-field-dark p-6 text-rice sm:grid-cols-[1fr_auto] sm:p-8">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-paddy-light">
              {category.name} · {category.pack.noun} trace
            </p>
            <span className="rounded-full bg-rice/15 px-2.5 py-0.5 text-xs font-semibold text-rice">✓ Verified batch</span>
            <SalesModelBadge model={batch.salesModel} categoryId={batch.categoryId} />
          </div>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">{product?.name ?? `${batch.variety} ${category.nouns.product}`}</h1>
          <p className="mt-2 text-rice/75">
            Grown by {farmer.name} in {farmer.village}, {farmer.state} · {PARTNER_TYPES[partner.type].verb} {partner.name}
          </p>
          <p className="mt-3 font-mono text-sm text-paddy-light">{batch.id}</p>

          <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {summary.map((f) => (
              <div key={f.label}>
                <dt className="text-[11px] uppercase tracking-wider text-rice/55">{f.label}</dt>
                <dd className="font-semibold">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        {product && <ProducePack product={product} farmerName={farmer.name} className="mx-auto h-48 w-auto sm:h-56" />}
      </header>

      <h2 className="sr-only">Journey of this {category.pack.noun}</h2>
      <div className="mt-12">
        <TraceTimeline stages={stages} />
      </div>

      {product && (
        <section className="mt-12 grid gap-6 rounded-2xl bg-white/75 p-6 shadow-card ring-1 ring-husk/10 sm:grid-cols-[1fr_1.2fr] sm:p-8">
          <div>
            <h2 className="text-2xl font-semibold text-field">Liked {category.nouns.this}?</h2>
            <p className="mt-2 text-sm text-soil/75">
              Buy again from {farmer.name}&apos;s harvest. The price split stays the same, every time.
            </p>
            <Link href={`/product/${product.id}`} className={buttonClasses("primary", "mt-5")}>
              {product.inStock ? "Buy from this batch" : `See ${category.nouns.this}`}
            </Link>
          </div>
          <PriceBreakdown
            breakdown={product.priceBreakdown}
            price={product.price}
            categoryId={batch.categoryId}
            purchase={batch.purchase}
          />
        </section>
      )}
    </div>
  );
}
