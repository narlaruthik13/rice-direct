import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, ExternalLink, Pencil } from "lucide-react";
import type { AdminBatchDetail, AdminPartner, AuditEntry } from "@kisa/shared";
import { ActiveToggle } from "@/components/ActiveToggle";
import { ExpiryBadge, StockBadge, partLabels } from "@/components/catalogue/bits";
import { ProductDialog } from "@/components/catalogue/ProductDialog";
import { StockDialog } from "@/components/catalogue/StockDialog";
import { Detail, PageHeader } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { setProductActive } from "@/lib/actions";
import { ApiRequestError, apiFetch } from "@/lib/api";
import { CATEGORY_LABEL, dateTime, MODEL_LABEL, REASON_LABEL, rupees, shortDate } from "@/lib/format";
import { canEdit, getMe } from "@/lib/me";
import { traceUrl } from "@/lib/web-url";

export const metadata: Metadata = { title: "Batch" };

const label = (key: string) => key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
const show = (v: unknown) => (v === null || v === undefined || v === "" ? "–" : typeof v === "object" ? JSON.stringify(v) : String(v));

function AuditList({ entries }: { entries: AuditEntry[] }) {
  if (entries.length === 0) return <p className="text-sm text-muted-foreground">No changes recorded yet.</p>;
  return (
    <ol className="space-y-3">
      {entries.map((a) => {
        const changes = Object.entries(a.changes);
        return (
          <li key={a.id} className="rounded-md border p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold">
                {a.entity} · {a.action.replace("_", " ").toLowerCase()}
              </span>
              <span className="text-xs text-muted-foreground">
                {a.admin.name} · {dateTime(a.createdAt)}
              </span>
            </div>
            {a.action === "CREATE" ? (
              <p className="mt-1 text-xs text-muted-foreground">{changes.length} fields set</p>
            ) : (
              <ul className="mt-1 space-y-0.5 text-xs">
                {changes.map(([k, c]) => (
                  <li key={k}>
                    <span className="text-muted-foreground">{label(k)}:</span> <s className="text-muted-foreground">{show(c.before)}</s> → <span className="font-semibold">{show(c.after)}</span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export default async function BatchPage({ params }: { params: { id: string } }) {
  const [me, batch] = await Promise.all([
    getMe(),
    apiFetch<AdminBatchDetail>(`/admin/batches/${encodeURIComponent(params.id)}`).catch((e) => {
      if (e instanceof ApiRequestError && e.status === 404) notFound();
      throw e;
    }),
  ]);
  const partner = await apiFetch<AdminPartner>(`/admin/partners/${encodeURIComponent(batch.partner.id)}`);
  const editable = canEdit(me);
  const labels = partLabels(batch.salesModel);

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ href: "/catalogue", label: "Batches & Products" }}
        title={<span className="font-mono">{batch.id}</span>}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {CATEGORY_LABEL[batch.categoryId]} · {batch.variety}
            <Badge variant="outline">{MODEL_LABEL[batch.salesModel]}</Badge>
            <StockBadge status={batch.stockStatus} />
            <ExpiryBadge daysLeft={batch.daysLeft} />
          </span>
        }
        actions={
          <>
            <Button asChild variant="outline">
              <a href={traceUrl(batch.id)} target="_blank" rel="noreferrer">
                <ExternalLink aria-hidden="true" />
                Trace page
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={`/api/qr/${batch.id}`} download={`kisa-trace-${batch.id}.png`}>
                <Download aria-hidden="true" />
                QR code
              </a>
            </Button>
            <StockDialog batchId={batch.id} availableKg={batch.availableKg} outputKg={batch.outputKg} />
            {editable && (
              <Button asChild>
                <Link href={`/catalogue/${batch.id}/edit`}>
                  <Pencil aria-hidden="true" />
                  Edit batch
                </Link>
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Batch</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-3">
              <Detail label="Farmer">
                <Link href={`/farmers/${batch.farmer.id}`} className="font-semibold text-field hover:underline">
                  {batch.farmer.name}
                </Link>
              </Detail>
              <Detail label="Partner">
                <Link href={`/partners/${batch.partner.id}`} className="font-semibold text-field hover:underline">
                  {batch.partner.name}
                </Link>
              </Detail>
              <Detail label="Harvested">{shortDate(batch.harvestDate)}</Detail>
              <Detail label="Packed">{shortDate(batch.packedDate)}</Detail>
              <Detail label="In / out">
                {batch.inputKg.toLocaleString("en-IN")} kg / {batch.outputKg.toLocaleString("en-IN")} kg
              </Detail>
              {batch.purchase && (
                <Detail label="Bought from farmer">
                  {rupees(batch.purchase.pricePerKg)}/kg on {shortDate(batch.purchase.date)}
                </Detail>
              )}
              {batch.shelfLifeDays && (
                <Detail label="Shelf life">
                  {batch.shelfLifeDays} days{batch.expiresOn ? ` (until ${shortDate(batch.expiresOn)})` : ""}
                </Detail>
              )}
              {Object.entries(batch.attributes).map(([k, v]) => (
                <Detail key={k} label={label(k)}>
                  {show(v)}
                </Detail>
              ))}
            </dl>
            <h3 className="mb-2 mt-6 font-display text-lg font-semibold">Quality report</h3>
            <dl className="grid gap-4 sm:grid-cols-3">
              {Object.entries(batch.quality).map(([k, v]) => (
                <Detail key={k} label={label(k)}>
                  {show(v)}
                </Detail>
              ))}
            </dl>
            {batch.hasOrders && (
              <p className="mt-4 rounded-md bg-secondary px-3 py-2 text-sm">This batch has orders, so its sales model, farmer, partner and output are locked.</p>
            )}
          </CardContent>
        </Card>

        <Card className="self-start">
          <CardHeader>
            <CardTitle>Stock</CardTitle>
            <CardDescription>Orders reduce stock automatically.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-display text-4xl font-semibold" data-testid="available-kg">
              {batch.availableKg.toLocaleString("en-IN")} kg
            </p>
            <p className="text-sm text-muted-foreground">of {batch.outputKg.toLocaleString("en-IN")} kg packed</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary" aria-hidden="true">
              <div className="h-full bg-field" style={{ width: `${(batch.availableKg / batch.outputKg) * 100}%` }} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Packs</CardTitle>
            {editable && (
              <ProductDialog
                batchId={batch.id}
                model={batch.salesModel}
                category={batch.category}
                defaultName={batch.variety}
                suggestPartnerShare={batch.salesModel === "FARMER_OWNED" ? partner.processingFeePerKg : undefined}
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {batch.products.length === 0 ? (
            <p className="text-sm text-muted-foreground">No packs yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Pack</TableHead>
                  <TableHead>{labels.farmer}</TableHead>
                  <TableHead>{labels.partner}</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Packs left</TableHead>
                  <TableHead>Status</TableHead>
                  {editable && <TableHead className="sr-only">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {batch.products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <span className="font-semibold">{p.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {p.bagSizeKg} kg · {p.slug}
                      </span>
                    </TableCell>
                    <TableCell>{rupees(p.farmerShare)}</TableCell>
                    <TableCell>{rupees(p.partnerShare)}</TableCell>
                    <TableCell>{rupees(p.platformFee)}</TableCell>
                    <TableCell className="font-semibold">{rupees(p.price)}</TableCell>
                    <TableCell>{p.packsAvailable}</TableCell>
                    <TableCell>{p.isActive ? <Badge variant="secondary">Active</Badge> : <Badge variant="danger">Inactive</Badge>}</TableCell>
                    {editable && (
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <ProductDialog batchId={batch.id} model={batch.salesModel} category={batch.category} product={p} />
                          <ActiveToggle
                            isActive={p.isActive}
                            name={p.name}
                            noun="pack"
                            consequence="It disappears from the shop."
                            action={setProductActive.bind(null, p.id)}
                          />
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Stock history</CardTitle>
          </CardHeader>
          <CardContent>
            {batch.stockAdjustments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No manual adjustments.</p>
            ) : (
              <ul className="divide-y" data-testid="stock-history">
                {batch.stockAdjustments.map((s) => (
                  <li key={s.id} className="flex items-start justify-between gap-3 py-2 text-sm">
                    <div>
                      <span className={s.deltaKg < 0 ? "font-semibold text-destructive" : "font-semibold text-field"}>
                        {s.deltaKg > 0 ? "+" : ""}
                        {s.deltaKg} kg
                      </span>{" "}
                      · {REASON_LABEL[s.reason]}
                      {s.note && <span className="block text-xs text-muted-foreground">{s.note}</span>}
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      {s.availableBefore} → {s.availableAfter} kg
                      <span className="block">
                        {s.admin.name} · {dateTime(s.createdAt)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Audit history</CardTitle>
          </CardHeader>
          <CardContent>
            <AuditList entries={batch.audit} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
