import "server-only";

/** The public website's trace page for a batch (what the pack's QR code opens). Server-only WEB_URL. */
export function traceUrl(batchId: string): string {
  const base = (process.env.WEB_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  return `${base}/trace/${encodeURIComponent(batchId)}`;
}
