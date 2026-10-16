import type { StockStatusValue } from "@kisa/shared";
import { Badge } from "@/components/ui/badge";
import { rupees } from "@/lib/format";

const STOCK: Record<StockStatusValue, { label: string; variant: "secondary" | "warning" | "danger" }> = {
  in_stock: { label: "In stock", variant: "secondary" },
  low: { label: "Low stock", variant: "warning" },
  sold_out: { label: "Sold out", variant: "danger" },
};

export function StockBadge({ status }: { status: StockStatusValue }) {
  return (
    <Badge variant={STOCK[status].variant} data-testid="stock-badge">
      {STOCK[status].label}
    </Badge>
  );
}

export function ExpiryBadge({ daysLeft }: { daysLeft: number | null }) {
  if (daysLeft === null) return null;
  if (daysLeft <= 0) return <Badge variant="danger">Expired</Badge>;
  return <Badge variant={daysLeft <= 7 ? "warning" : "outline"}>{daysLeft} days left</Badge>;
}

export const partLabels = (model: "FARMER_OWNED" | "PARTNER_SOURCED") =>
  model === "FARMER_OWNED"
    ? { farmer: "Farmer's share", partner: "Processing fee", platform: "Platform fee" }
    : { farmer: "Paid to farmer", partner: "Partner margin", platform: "Platform fee" };

const round2 = (n: number) => Math.round(n * 100) / 100;
export const sumParts = (a: number, b: number, c: number) => round2((Number(a) || 0) + (Number(b) || 0) + (Number(c) || 0));

/** Live split of one pack's price: each party's rupees and share of the price. */
export function PricePreview({
  model,
  farmerShare,
  partnerShare,
  platformFee,
}: {
  model: "FARMER_OWNED" | "PARTNER_SOURCED";
  farmerShare: number;
  partnerShare: number;
  platformFee: number;
}) {
  const labels = partLabels(model);
  const parts = [
    { key: "farmer", label: labels.farmer, value: Number(farmerShare) || 0, color: "bg-field" },
    { key: "partner", label: labels.partner, value: Number(partnerShare) || 0, color: "bg-husk" },
    { key: "platform", label: labels.platform, value: Number(platformFee) || 0, color: "bg-paddy" },
  ];
  const price = sumParts(parts[0].value, parts[1].value, parts[2].value);
  const pct = (v: number) => (price > 0 ? `${Math.round((v / price) * 1000) / 10}%` : "–");
  return (
    <div className="rounded-md border bg-secondary/40 p-3" data-testid="price-preview">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Customer price</span>
        <span className="font-display text-xl font-semibold" data-testid="preview-price">
          {rupees(price)}
        </span>
      </div>
      <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-secondary" aria-hidden="true">
        {parts.map((p) => (
          <div key={p.key} className={p.color} style={{ width: price > 0 ? `${(p.value / price) * 100}%` : 0 }} />
        ))}
      </div>
      <dl className="mt-2 grid grid-cols-3 gap-2 text-xs">
        {parts.map((p) => (
          <div key={p.key}>
            <dt className="flex items-center gap-1 text-muted-foreground">
              <span className={`size-2 rounded-full ${p.color}`} aria-hidden="true" />
              {p.label}
            </dt>
            <dd className="font-semibold">
              {rupees(p.value)} <span className="font-normal text-muted-foreground">({pct(p.value)})</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
