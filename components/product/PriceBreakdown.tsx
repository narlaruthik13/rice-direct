import type { CategoryId, FarmerPurchase, PartnerType, PriceBreakdown as Breakdown } from "@/lib/types";
import { categories } from "@/lib/categories";
import { formatDate, formatINR } from "@/lib/format";
import { priceLines, splitLines, type PricePart, type PriceSplit } from "@/lib/pricing";

const colors: Record<PricePart, string> = {
  farmer: "bg-field",
  partner: "bg-paddy",
  platform: "bg-husk-light",
};

interface PriceBreakdownProps {
  /** One product's model-aware breakdown, or a summed split (cart / order). */
  breakdown: Breakdown | PriceSplit;
  price: number;
  /** Words the partner line ("Milling fee", "Packhouse margin", ...) from the category config. */
  categoryId?: CategoryId;
  /** Overrides the category's partner type for wording. */
  partnerType?: PartnerType;
  /** PARTNER_SOURCED: shows "Bought from the farmer on [date] at ₹X/kg" under the farmer line. */
  purchase?: FarmerPurchase;
  /** Compact: thin bar + farmer amount only (cards). Full: bar + legend + total. */
  compact?: boolean;
}

export function PriceBreakdown({ breakdown, price, categoryId, partnerType, purchase, compact = false }: PriceBreakdownProps) {
  const type = partnerType ?? (categoryId ? categories[categoryId].partnerType : undefined);
  const lines = "model" in breakdown ? priceLines(breakdown, type) : splitLines(breakdown);
  const rawNoun = categoryId ? categories[categoryId].nouns.raw : "produce";
  const showPurchase = purchase && "model" in breakdown && breakdown.model === "PARTNER_SOURCED";
  const segments = lines.map((l) => ({ ...l, pct: price > 0 ? (l.amount / price) * 100 : 0 }));

  const bar = (
    <div className={`flex overflow-hidden rounded-full bg-rice-dim ${compact ? "h-1.5" : "h-3"}`} aria-hidden="true">
      {segments.map((s) => (
        <div key={s.part} className={colors[s.part]} style={{ width: `${s.pct}%` }} />
      ))}
    </div>
  );

  if (compact) {
    const farmer = segments[0];
    const verb = "model" in breakdown && breakdown.model === "PARTNER_SOURCED" ? "paid to the farmer" : "goes to the farmer";
    return (
      <div className="space-y-1.5">
        {bar}
        <p className="text-xs text-soil/70">
          <span className="font-semibold text-field">{formatINR(farmer.amount)}</span> ({Math.round(farmer.pct)}%) {verb}
          <span className="sr-only">
            {segments
              .slice(1)
              .map((s) => `, ${formatINR(s.amount)} ${s.label.toLowerCase()}`)
              .join("")}
          </span>
        </p>
      </div>
    );
  }

  return (
    <div>
      {bar}
      <dl className="mt-4 space-y-2 text-sm">
        {segments.map((s) => (
          <div key={s.part} className="grid grid-cols-[1fr_auto] items-center gap-x-4">
            <dt className="flex items-center gap-2 text-soil/80">
              <span className={`h-2.5 w-2.5 rounded-full ${colors[s.part]}`} aria-hidden="true" />
              {s.label}
              <span className="text-xs text-soil/50">{Math.round(s.pct)}%</span>
            </dt>
            <dd className="font-medium tabular-nums">{formatINR(s.amount)}</dd>
            {s.part === "farmer" && showPurchase && (
              <dd className="col-span-2 ml-[18px] mt-0.5 text-xs text-soil/60">
                Bought from the farmer on {formatDate(purchase.date)} at ₹{purchase.pricePerKg}/kg {rawNoun}
              </dd>
            )}
          </div>
        ))}
        <div className="flex items-center justify-between gap-4 border-t border-husk/15 pt-2 font-semibold">
          <dt>You pay</dt>
          <dd className="tabular-nums">{formatINR(price)}</dd>
        </div>
      </dl>
    </div>
  );
}
