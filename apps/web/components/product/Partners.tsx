import type { ReactNode } from "react";
import type { Farmer, Partner, Product } from "@kisa/shared";
import { categories, PARTNER_TYPES } from "@/lib/categories";
import { formatDate } from "@/lib/format";
import { initials, methodLabel } from "@/lib/farmers";
import { getBatch } from "@/data/mock";

function Card({ children }: { children: ReactNode }) {
  return <article className="rounded-2xl bg-white/70 p-6 shadow-card ring-1 ring-husk/10">{children}</article>;
}

function Badge({ children, tone }: { children: ReactNode; tone: "field" | "paddy" }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
        tone === "field" ? "bg-field text-rice" : "bg-paddy/25 text-husk-dark"
      }`}
    >
      {children}
    </span>
  );
}

/** The farmer behind a product. Ownership wording depends on the sales model. */
export function FarmerCard({ farmer, product }: { farmer: Farmer; product: Product }) {
  const thisProduce = categories[product.categoryId].nouns.this;
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-4">
          <span
            className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-field font-display text-lg font-semibold text-rice"
            aria-hidden="true"
          >
            {initials(farmer.name)}
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-husk">Farmer</p>
            <h3 className="text-xl font-semibold text-field">{farmer.name}</h3>
            <p className="text-sm text-soil/70">
              {farmer.village}, {farmer.district}, {farmer.state}
            </p>
          </div>
        </div>
        <Badge tone="field">{product.salesModel === "FARMER_OWNED" ? `Owns ${thisProduce}` : `Grew ${thisProduce}`}</Badge>
      </div>
      <dl className="mt-5 grid grid-cols-3 gap-2 rounded-xl bg-rice-dim/70 p-3 text-center text-sm">
        <div>
          <dt className="text-[11px] uppercase tracking-wider text-soil/60">Acres</dt>
          <dd className="font-semibold">{farmer.acres}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wider text-soil/60">Years</dt>
          <dd className="font-semibold">{farmer.yearsFarming}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wider text-soil/60">Method</dt>
          <dd className="font-semibold">{methodLabel[farmer.method]}</dd>
        </div>
      </dl>
      <p className="mt-4 text-sm leading-relaxed text-soil/80">{farmer.story}</p>
    </Card>
  );
}

/** The mill or packhouse. FARMER_OWNED: paid service. PARTNER_SOURCED: bought the lot. */
export function PartnerCard({ partner, product }: { partner: Partner; product: Product }) {
  const words = PARTNER_TYPES[partner.type];
  const { raw, product: produce } = categories[product.categoryId].nouns;
  const farmerOwned = product.salesModel === "FARMER_OWNED";
  const purchase = getBatch(product.batchId)?.purchase;

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-husk text-rice" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
              {partner.type === "MILL" ? (
                <>
                  <circle cx="8" cy="13" r="4" />
                  <circle cx="16" cy="13" r="4" />
                  <path d="M9 3h6l-2 4h-2L9 3Z" />
                </>
              ) : (
                <path d="M3 10l9-6 9 6v10H3V10Zm5 10v-6h8v6M3 10h18" />
              )}
            </svg>
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-husk">{words.title}</p>
            <h3 className="text-xl font-semibold text-field">{partner.name}</h3>
            <p className="text-sm text-soil/70">
              {partner.town}, {partner.district}, {partner.state} · since {partner.established}
            </p>
          </div>
        </div>
        <Badge tone="paddy">{farmerOwned ? "Service partner" : "Bought from the farmer"}</Badge>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 rounded-xl bg-rice-dim/70 p-3 text-sm">
        {farmerOwned ? (
          <>
            <span className="text-soil/70">{words.feeLabel} charged to the farmer</span>
            <span className="font-semibold">₹{partner.processingFeePerKg}/kg</span>
          </>
        ) : (
          <>
            <span className="text-soil/70">
              Paid the farmer{purchase ? ` on ${formatDate(purchase.date)}` : ""}
            </span>
            <span className="font-semibold">{purchase ? `₹${purchase.pricePerKg}/kg ${raw}` : "Published price"}</span>
          </>
        )}
      </div>

      <ul className="mt-4 flex flex-wrap gap-2">
        {partner.certifications.map((c) => (
          <li key={c} className="rounded-full border border-husk/30 px-3 py-1 text-xs font-medium">
            {c}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm leading-relaxed text-soil/80">
        {farmerOwned
          ? `The ${words.noun} ${words.work} the farmer's ${raw} for a fixed fee. It never buys or resells the ${produce}.`
          : `The ${words.noun} bought this lot from the farmer at a published price, then ${words.workDone} it.`}
      </p>
    </Card>
  );
}
