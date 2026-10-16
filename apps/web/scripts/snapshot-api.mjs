/**
 * Saves the public API's responses as the website's mock data (data/api-snapshot.json),
 * so mock data has exactly the API's shapes. Until the website calls the API directly,
 * re-run this after changing the seed:
 *
 *   API_URL=http://localhost:4000 pnpm --filter @kisa/web mock:snapshot
 *
 * Output: { categories, varieties, products, traces: { [batchId]: TraceResponse } }.
 * Only public endpoints are used, so the snapshot can't contain mill data.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const base = `${(process.env.API_URL ?? "http://localhost:4000").replace(/\/+$/, "")}/api/v1`;
const get = async (path) => {
  const res = await fetch(base + path);
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status}`);
  return res.json();
};

const [categories, varieties, listed] = await Promise.all([get("/categories"), get("/varieties"), get("/products")]);
const batchIds = [...new Set(listed.products.map((p) => p.batchId))];
const traces = Object.fromEntries(await Promise.all(batchIds.map(async (id) => [id, await get(`/trace/${encodeURIComponent(id)}`)])));

const file = join(import.meta.dirname, "..", "data", "api-snapshot.json");
writeFileSync(file, JSON.stringify({ source: `${base} (public endpoints)`, categories, varieties, products: listed.products, traces }, null, 2) + "\n");
console.log(JSON.stringify({ file, categories: categories.length, varieties: varieties.length, products: listed.products.length, traces: batchIds.length }));
