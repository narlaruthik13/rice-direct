import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { batches, getBatch, getFarmer, getMill, products } from "@/data/mock";
import { formatDate, formatINR } from "@/lib/format";
import { RiceBag } from "@/components/product/RiceBag";
import { PriceBreakdown } from "@/components/product/PriceBreakdown";
import { methodLabel } from "@/components/product/Partners";
import { TraceTimeline, type TraceStage } from "@/components/trace/TraceTimeline";
import { buttonClasses } from "@/components/ui/Button";

// The page a bag's QR code opens. One static page per batch; unknown ids 404.

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
  return {
    title: `Trace batch ${batch.id}`,
    description: `${batch.variety} grown by ${farmer?.name} in ${farmer?.village}. Harvest, milling and quality details for batch ${batch.id}.`,
  };
}

const days = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
const kg = (n: number) => `${n.toLocaleString("en-IN")} kg`;

export default function TracePage({ params }: Props) {
  const batch = getBatch(params.batchId);
  const farmer = batch && getFarmer(batch.farmerId);
  const mill = batch && getMill(batch.millId);
  if (!batch || !farmer || !mill) notFound();

  const product = products.find((p) => p.batchId === batch.id);
  const q = batch.quality;
  const agedTag = product?.tags.find((t) => t.startsWith("Aged "));
  // Same typical limits as the product page's QualityReport.
  const withinLimits = q.moisturePct <= 14 && q.brokenPct <= 5 && q.foreignMatterPct <= 0.25;

  const stages: TraceStage[] = [
    {
      key: "farm",
      title: `${farmer.name}'s farm`,
      body: farmer.story,
      facts: [
        { label: "Village", value: `${farmer.village}, ${farmer.district}` },
        { label: "Farm size", value: `${farmer.acres} acres` },
        { label: "Method", value: methodLabel[farmer.method] },
        { label: "Farming for", value: plural(farmer.yearsFarming, "year") },
      ],
    },
    {
      key: "harvest",
      title: "Harvest",
      date: formatDate(batch.harvestDate),
      dateTime: batch.harvestDate,
      body: `${farmer.name} harvested ${kg(batch.paddyKg)} of ${batch.variety} paddy. The paddy, and the rice it becomes, belongs to the farmer.`,
      facts: [
        { label: "Variety", value: batch.variety },
        { label: "Paddy", value: kg(batch.paddyKg) },
      ],
    },
    {
      key: "mill",
      title: "Milling",
      date: formatDate(batch.millingDate),
      dateTime: batch.millingDate,
      gap: `${plural(days(batch.harvestDate, batch.millingDate), "day")} after harvest`,
      body: `${mill.name} in ${mill.town} hulled and polished the paddy as a paid service, charging the farmer ₹${mill.millingFeePerKg}/kg. The mill never owned the rice.`,
      facts: [
        { label: "Paddy in", value: kg(batch.paddyKg) },
        { label: "Rice out", value: kg(batch.riceKg) },
        { label: "Yield", value: `${Math.round((batch.riceKg / batch.paddyKg) * 100)}%` },
        { label: "Milling fee", value: `₹${mill.millingFeePerKg}/kg` },
      ],
    },
    {
      key: "quality",
      title: "Quality check",
      date: formatDate(q.testedOn),
      dateTime: q.testedOn,
      gap: `${plural(days(batch.millingDate, q.testedOn), "day")} after milling`,
      body: `Tested by ${q.testedBy} and graded ${q.grade}. ${
        withinLimits ? "Every measure is within typical limits for packaged rice." : "See the product page for the full report."
      }`,
      facts: [
        { label: "Moisture", value: `${q.moisturePct}%` },
        { label: "Broken", value: `${q.brokenPct}%` },
        { label: "Foreign matter", value: `${q.foreignMatterPct}%` },
        { label: "Grain length", value: `${q.grainLengthMm} mm` },
      ],
    },
    {
      key: "pack",
      title: batch.age === "aged" ? "Aged and packed" : "Packed fresh",
      body:
        batch.age === "aged"
          ? `Stored to age${agedTag ? ` (${agedTag.toLowerCase()})` : ""} so the grains cook fluffier and more separate, then packed into jute bags printed with batch ${batch.id}.`
          : `Packed soon after milling into jute bags printed with batch ${batch.id}, for the soft texture of new-crop rice.`,
      facts: product
        ? [
            { label: "Bag size", value: `${product.bagSizeKg} kg` },
            { label: "Bags in batch", value: `~${Math.floor(batch.riceKg / product.bagSizeKg)}` },
          ]
        : [],
      link: product ? { href: `/product/${product.id}`, label: "See this rice in the shop" } : undefined,
    },
    {
      key: "you",
      title: "Your kitchen",
      body: product
        ? `Of the ${formatINR(product.price)} you paid, ${formatINR(product.priceBreakdown.farmerShare)} went to ${farmer.name}, ${formatINR(product.priceBreakdown.millingFee)} to the mill for milling, and ${formatINR(product.priceBreakdown.platformFee)} to Vari Direct.`
        : `This bag travelled from ${farmer.village} to you with no middlemen.`,
      facts: [],
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      {/* Summary card */}
      <header className="grid items-center gap-6 rounded-3xl bg-field-dark p-6 text-rice sm:grid-cols-[1fr_auto] sm:p-8">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-paddy-light">Bag trace</p>
            <span className="rounded-full bg-rice/15 px-2.5 py-0.5 text-xs font-semibold text-rice">✓ Verified batch</span>
          </div>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">{product?.name ?? batch.variety}</h1>
          <p className="mt-2 text-rice/75">
            Grown by {farmer.name} in {farmer.village}, {farmer.state} · milled at {mill.name}
          </p>
          <p className="mt-3 font-mono text-sm text-paddy-light">{batch.id}</p>

          <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Harvested", value: formatDate(batch.harvestDate) },
              { label: "Milled", value: formatDate(batch.millingDate) },
              { label: "Grade", value: q.grade },
              {
                label: "To farmer",
                value: product
                  ? `${Math.round((product.priceBreakdown.farmerShare / product.price) * 100)}%`
                  : "—",
              },
            ].map((f) => (
              <div key={f.label}>
                <dt className="text-[11px] uppercase tracking-wider text-rice/55">{f.label}</dt>
                <dd className="font-semibold">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        {product && (
          <RiceBag
            farmerName={farmer.name}
            variety={product.variety}
            weightKg={product.bagSizeKg}
            batchId={batch.id}
            aged={product.age === "aged"}
            className="mx-auto h-48 w-auto sm:h-56"
          />
        )}
      </header>

      <h2 className="sr-only">Journey of this bag</h2>
      <div className="mt-12">
        <TraceTimeline stages={stages} />
      </div>

      {product && (
        <section className="mt-12 grid gap-6 rounded-2xl bg-white/75 p-6 shadow-card ring-1 ring-husk/10 sm:grid-cols-[1fr_1.2fr] sm:p-8">
          <div>
            <h2 className="text-2xl font-semibold text-field">Liked this rice?</h2>
            <p className="mt-2 text-sm text-soil/75">
              Buy again straight from {farmer.name}. The price split stays the same, every time.
            </p>
            <Link href={`/product/${product.id}`} className={buttonClasses("primary", "mt-5")}>
              {product.inStock ? "Buy from this batch" : "See this rice"}
            </Link>
          </div>
          <PriceBreakdown breakdown={product.priceBreakdown} price={product.price} />
        </section>
      )}
    </div>
  );
}
