import type { StockStatusValue } from "@kisa/shared";
import { Badge } from "@/components/ui/badge";
import { marginPct, rupees } from "@/lib/format";

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

/** Days until the best-before date: highlighted within 30 days, red once past. */
export function BestBeforeBadge({ daysLeft }: { daysLeft: number }) {
  if (daysLeft <= 0) return <Badge variant="danger">Past best-before</Badge>;
  if (daysLeft <= 30) return <Badge variant="warning">{daysLeft} days to best-before</Badge>;
  return null;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
export const priceOf = (millPrice: number, kisaMargin: number) => round2((Number(millPrice) || 0) + (Number(kisaMargin) || 0));

/** Live preview of one pack: the total customers pay, and how it splits (admin only). */
export function PricePreview({ millPrice, kisaMargin }: { millPrice: number; kisaMargin: number }) {
  const mill = Number(millPrice) || 0;
  const margin = Number(kisaMargin) || 0;
  const price = priceOf(mill, margin);
  return (
    <div className="rounded-md border bg-secondary/40 p-3" data-testid="price-preview">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Customer price</span>
        <span className="font-display text-xl font-semibold" data-testid="preview-price">
          {rupees(price)}
        </span>
      </div>
      <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-secondary" aria-hidden="true">
        <div className="bg-husk" style={{ width: price > 0 ? `${(mill / price) * 100}%` : 0 }} />
        <div className="bg-paddy" style={{ width: price > 0 ? `${(margin / price) * 100}%` : 0 }} />
      </div>
      <dl className="mt-2 grid grid-cols-2 gap-2 text-xs">
        <div>
          <dt className="flex items-center gap-1 text-muted-foreground">
            <span className="size-2 rounded-full bg-husk" aria-hidden="true" />
            Mill price
          </dt>
          <dd className="font-semibold">{rupees(mill)}</dd>
        </div>
        <div>
          <dt className="flex items-center gap-1 text-muted-foreground">
            <span className="size-2 rounded-full bg-paddy" aria-hidden="true" />
            Kisa margin
          </dt>
          <dd className="font-semibold" data-testid="preview-margin">
            {rupees(margin)} <span className="font-normal text-muted-foreground">({marginPct(margin, price)})</span>
          </dd>
        </div>
      </dl>
      <p className="mt-2 text-xs text-muted-foreground">Customers see only the total.</p>
    </div>
  );
}
