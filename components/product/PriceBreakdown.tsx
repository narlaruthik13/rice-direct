import type { PriceBreakdown as Breakdown } from "@/lib/types";
import { formatINR } from "@/lib/format";

const parts = [
  { key: "farmerShare", label: "Farmer", bar: "bg-field", dot: "bg-field" },
  { key: "millingFee", label: "Milling fee", bar: "bg-paddy", dot: "bg-paddy" },
  { key: "platformFee", label: "Platform fee", bar: "bg-husk-light", dot: "bg-husk-light" },
] as const;

interface PriceBreakdownProps {
  breakdown: Breakdown;
  price: number;
  /** Compact: thin bar + farmer share only (cards). Full: bar + legend + total. */
  compact?: boolean;
}

export function PriceBreakdown({ breakdown, price, compact = false }: PriceBreakdownProps) {
  const segments = parts.map((p) => ({ ...p, amount: breakdown[p.key], pct: (breakdown[p.key] / price) * 100 }));

  const bar = (
    <div className={`flex overflow-hidden rounded-full bg-rice-dim ${compact ? "h-1.5" : "h-3"}`} aria-hidden="true">
      {segments.map((s) => (
        <div key={s.key} className={s.bar} style={{ width: `${s.pct}%` }} />
      ))}
    </div>
  );

  if (compact) {
    const farmer = segments[0];
    return (
      <div className="space-y-1.5">
        {bar}
        <p className="text-xs text-soil/70">
          <span className="font-semibold text-field">{formatINR(farmer.amount)}</span> ({Math.round(farmer.pct)}%) goes to the
          farmer
          <span className="sr-only">
            , {formatINR(breakdown.millingFee)} milling fee, {formatINR(breakdown.platformFee)} platform fee
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
          <div key={s.key} className="flex items-center justify-between gap-4">
            <dt className="flex items-center gap-2 text-soil/80">
              <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} aria-hidden="true" />
              {s.label}
              <span className="text-xs text-soil/50">{Math.round(s.pct)}%</span>
            </dt>
            <dd className="font-medium tabular-nums">{formatINR(s.amount)}</dd>
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
