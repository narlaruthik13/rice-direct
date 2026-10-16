import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTrace, load, staticBatchIds } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { ageLabel, typeLabel } from "@/lib/rice";
import { ProductCard } from "@/components/product/ProductCard";
import { QualityReport } from "@/components/product/QualityReport";
import { PassportTimeline } from "@/components/trace/PassportTimeline";
import { CatalogueUnavailable } from "@/components/ui/CatalogueUnavailable";

interface Props {
  params: { batchId: string };
}

// The page a bag's QR code opens. Mock data: every batch is pre-rendered. API: rendered on
// demand from cached data. Unknown ids 404.
export function generateStaticParams() {
  return staticBatchIds().map((batchId) => ({ batchId }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const trace = await load(() => getTrace(params.batchId));
  if (!trace.ok || !trace.data) return {};
  const p = trace.data.passport;
  return {
    title: `Quality Passport ${p.batchId}`,
    description: `${p.variety.name}, ${typeLabel(p.riceType).toLowerCase()} rice. Milled ${formatDate(p.millingDate)}, packed ${formatDate(p.packedDate)}, best before ${formatDate(p.bestBefore)}.`,
  };
}

export default async function QualityPassportPage({ params }: Props) {
  const trace = await load(() => getTrace(params.batchId));
  if (!trace.ok) {
    return (
      <div className="mx-auto max-w-site px-4 py-12 sm:px-6">
        <p className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-husk">Quality Passport</p>
        <CatalogueUnavailable retryHref={`/trace/${encodeURIComponent(params.batchId)}`} />
      </div>
    );
  }
  if (!trace.data) notFound();
  const { passport, products } = trace.data;
  const pastBestBefore = passport.bestBefore <= new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-site px-4 py-12 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-husk">Quality Passport</p>
      <h1 className="mt-2 text-4xl font-semibold text-field">
        {passport.variety.name}, {typeLabel(passport.riceType)}
      </h1>
      <p className="mt-2 text-soil/75">
        {ageLabel(passport.age)} · batch <span className="font-mono text-sm font-semibold text-soil">{passport.batchId}</span>
      </p>
      {pastBestBefore && (
        <p role="status" className="mt-4 rounded-xl bg-paddy-light/40 px-4 py-2.5 text-sm text-soil">
          This batch passed its best-before date on {formatDate(passport.bestBefore)}.
        </p>
      )}

      <dl className="mt-8 grid grid-cols-2 gap-3 rounded-2xl bg-white/70 p-5 shadow-card ring-1 ring-husk/10 sm:grid-cols-5">
        {[
          ["Variety", passport.variety.name],
          ["Type", typeLabel(passport.riceType)],
          ["Milled", formatDate(passport.millingDate)],
          ["Packed", formatDate(passport.packedDate)],
          ["Best before", formatDate(passport.bestBefore)],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-[11px] uppercase tracking-wider text-soil/55">{label}</dt>
            <dd className="text-sm font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <section className="rounded-2xl bg-white/70 p-6 shadow-card ring-1 ring-husk/10 sm:p-8">
          <h2 className="text-2xl font-semibold text-field">This batch, step by step</h2>
          <div className="mt-6">
            <PassportTimeline passport={passport} />
          </div>
        </section>
        <section className="rounded-2xl bg-white/70 p-6 shadow-card ring-1 ring-husk/10 sm:p-8">
          <h2 className="text-2xl font-semibold text-field">Quality report</h2>
          <div className="mt-6">
            <QualityReport quality={passport.quality} />
          </div>
        </section>
      </div>

      {products.length > 0 && (
        <section className="mt-14">
          <h2 className="text-2xl font-semibold text-field">Packs from this batch</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <div key={p.id} className="flex">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="mt-12 text-sm text-soil/70">
        Every Kisa bag carries a QR code to its batch&apos;s Quality Passport.{" "}
        <Link href="/shop" className="font-semibold text-field underline decoration-paddy underline-offset-4">
          Shop Kisa rice
        </Link>
      </p>
    </div>
  );
}
