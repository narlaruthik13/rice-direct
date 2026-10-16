import type { Metadata } from "next";
import { AlertTriangle, Boxes, CircleSlash, PackageCheck, ShoppingBag, Timer } from "lucide-react";
import type { DashboardSummary } from "@kisa/shared";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";

export const metadata: Metadata = { title: "Dashboard" };

const longDate = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00Z`),
  );
const shortDate = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

function Stat({ label, value, icon: Icon, tone = "default" }: { label: string; value: number; icon: typeof Boxes; tone?: "default" | "warn" | "danger" }) {
  const toneClass = { default: "bg-secondary text-field", warn: "bg-paddy-light/50 text-soil", danger: "bg-destructive/10 text-destructive" }[tone];
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex flex-col gap-3 p-4 sm:p-5">
        <span className={`flex size-9 items-center justify-center rounded-md ${toneClass}`}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <div>
          <p className="font-display text-3xl font-semibold leading-none" data-testid={`stat-${label}`}>
            {value}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ListCard({ title, description, count, empty, children }: { title: string; description: string; count: number; empty: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>{title}</CardTitle>
          <Badge variant={count ? "warning" : "secondary"}>{count}</Badge>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {count === 0 ? <p className="rounded-md bg-secondary/60 px-3 py-6 text-center text-sm text-muted-foreground">{empty}</p> : <ul className="divide-y">{children}</ul>}
        {count > 5 && <p className="mt-3 text-xs text-muted-foreground">Showing 5 of {count}.</p>}
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const s = await apiFetch<DashboardSummary>("/admin/dashboard/summary");

  return (
    <div>
      <h1 className="text-3xl font-semibold">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">{longDate(s.today)}</p>

      <section aria-label="Key numbers" className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="Orders today" value={s.ordersToday} icon={ShoppingBag} />
        <Stat label="Active products" value={s.products.active} icon={Boxes} />
        <Stat label="In stock" value={s.products.inStock} icon={PackageCheck} />
        <Stat label="Sold out" value={s.products.soldOut} icon={CircleSlash} tone={s.products.soldOut ? "danger" : "default"} />
        <Stat label="Low stock" value={s.lowStock.count} icon={AlertTriangle} tone={s.lowStock.count ? "warn" : "default"} />
        <Stat label="Best before ≤ 30 days" value={s.bestBeforeSoon.count} icon={Timer} tone={s.bestBeforeSoon.count ? "warn" : "default"} />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <ListCard title="Low stock" description="Batches with fewer than 2 packs left." count={s.lowStock.count} empty="Nothing is running low.">
          {s.lowStock.items.map((b) => (
            <li key={b.batchId} className="flex items-start justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{b.products.join(", ")}</p>
                <p className="font-mono text-xs text-muted-foreground">{b.batchId}</p>
              </div>
              <div className="shrink-0 text-right text-sm">
                <p className="font-semibold">{b.availableKg} kg</p>
                <p className="text-xs text-muted-foreground">
                  {b.packsLeft} × {b.packSizeKg} kg pack
                </p>
              </div>
            </li>
          ))}
        </ListCard>

        <ListCard title="Best before within 30 days" description="Batches with stock that stop selling soon." count={s.bestBeforeSoon.count} empty="No batch reaches its best-before date in the next 30 days.">
          {s.bestBeforeSoon.items.map((b) => (
            <li key={b.batchId} className="flex items-start justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{b.variety}</p>
                <p className="font-mono text-xs text-muted-foreground">{b.batchId}</p>
              </div>
              <div className="shrink-0 text-right text-sm">
                <Badge variant={b.daysLeft <= 7 ? "danger" : "warning"}>
                  {b.daysLeft} {b.daysLeft === 1 ? "day" : "days"} left
                </Badge>
                <p className="mt-1 text-xs text-muted-foreground">
                  {b.availableKg} kg · until {shortDate(b.bestBefore)}
                </p>
              </div>
            </li>
          ))}
        </ListCard>

        <ListCard title="Sold out" description="Active products with no stock for a pack." count={s.soldOut.count} empty="Every product is in stock.">
          {s.soldOut.items.map((p) => (
            <li key={p.slug} className="py-3">
              <p className="truncate text-sm font-semibold">{p.name}</p>
              <p className="font-mono text-xs text-muted-foreground">{p.batchId}</p>
            </li>
          ))}
        </ListCard>
      </section>
    </div>
  );
}
