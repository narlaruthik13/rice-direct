import "server-only";
import type { AdminBatchDetail, AdminProduct } from "@kisa/shared";

// After a catalogue change, ask the public website to refresh the cached pages that show it
// (POST {WEB_URL}/api/revalidate). Best effort: a failure is logged and the admin still sees
// success, because the website's 5-minute revalidate catches up anyway.

/** Cache tags the website uses (apps/web/lib/data.ts). "catalogue" refreshes everything. */
export const webTags = {
  product: (p: Pick<AdminProduct, "slug" | "batchId">) => ["products", `product:${p.slug}`, `trace:${p.batchId}`],
  batch: (b: Pick<AdminBatchDetail, "id" | "products">) => ["products", `trace:${b.id}`, ...b.products.map((p) => `product:${p.slug}`)],
  /** Variety names appear on every product and Quality Passport page. */
  varieties: () => ["varieties", "catalogue"],
};

const TIMEOUT_MS = 5_000;

export async function revalidateWeb(tags: string[]): Promise<void> {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    console.warn("[revalidate-web] REVALIDATE_SECRET is not set; the website will update within 5 minutes.");
    return;
  }
  const url = `${(process.env.WEB_URL ?? "http://localhost:3000").replace(/\/+$/, "")}/api/revalidate`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-revalidate-secret": secret },
      body: JSON.stringify({ tags: [...new Set(tags)] }),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) console.error(`[revalidate-web] ${url} returned ${res.status} for ${tags.join(", ")}`);
  } catch (e) {
    console.error(`[revalidate-web] ${url} failed for ${tags.join(", ")}: ${e instanceof Error ? e.message : String(e)}`);
  }
}
