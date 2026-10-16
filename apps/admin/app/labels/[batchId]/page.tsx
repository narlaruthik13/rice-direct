import type { Metadata } from "next";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import type { AdminBatchDetail } from "@kisa/shared";
import { Logo } from "@kisa/ui/logo-static";
import { ApiRequestError, apiFetch } from "@/lib/api";
import { typeLabel } from "@/lib/format";
import { traceUrl } from "@/lib/web-url";
import { PrintButton } from "./PrintButton";

export const metadata: Metadata = { title: "Labels" };
export const dynamic = "force-dynamic";

/**
 * Printable bag labels for a batch: one per active pack size. Labels go to customers, so
 * they show ONLY Kisa, the variety, the type, the pack size and the batch id, plus the QR
 * code of the public Quality Passport. Never the mill (the batch data here is admin data,
 * so every field on the label is picked explicitly).
 */
export default async function LabelsPage({ params }: { params: { batchId: string } }) {
  const batch = await apiFetch<AdminBatchDetail>(`/admin/batches/${encodeURIComponent(params.batchId)}`).catch((e) => {
    if (e instanceof ApiRequestError && e.status === 404) notFound();
    throw e;
  });
  const sizes = [...new Set(batch.products.filter((p) => p.isActive).map((p) => p.bagSizeKg))].sort((a, b) => a - b);
  const qrSvg = await QRCode.toString(traceUrl(batch.id), { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#2E2219", light: "#FFFFFF" } });
  const label = { variety: batch.variety.name, type: typeLabel(batch.riceType), batchId: batch.id };

  return (
    <main className="min-h-screen bg-background p-6 print:bg-white print:p-0">
      <div className="mx-auto mb-6 flex max-w-3xl items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-semibold">Labels for {batch.id}</h1>
          <p className="text-sm text-muted-foreground">One label per pack size. Customers see these: only Kisa, the variety, type, pack size and batch id.</p>
        </div>
        <PrintButton />
      </div>
      {sizes.length === 0 ? (
        <p className="mx-auto max-w-3xl text-sm text-muted-foreground">This batch has no active packs yet.</p>
      ) : (
        <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2 print:block">
          {sizes.map((kg) => (
            <article
              key={kg}
              data-testid="bag-label"
              className="flex break-inside-avoid flex-col items-center gap-3 rounded-lg border-2 border-soil bg-white p-6 text-center text-soil print:mb-6"
            >
              <Logo size={40} />
              <div>
                <p className="font-display text-2xl font-semibold leading-tight">{label.variety}</p>
                <p className="text-base font-semibold uppercase tracking-[0.12em] text-husk">{label.type}</p>
              </div>
              <p className="font-display text-4xl font-semibold">{kg} kg</p>
              <div className="size-32" aria-label="QR code for the Quality Passport" role="img" dangerouslySetInnerHTML={{ __html: qrSvg }} />
              <p className="text-xs">Scan for the Quality Passport</p>
              <p className="font-mono text-sm font-semibold tracking-wider">{label.batchId}</p>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
