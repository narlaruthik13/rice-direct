// The website's only door to catalogue data. Server-only: pages fetch on the server and
// the browser never calls the API.
//
//   DATA_SOURCE=mock (default)  the API snapshot in data/api-snapshot.json
//   DATA_SOURCE=api             the Kisa API at API_URL
//
// With the API, responses go into Next's Data Cache with tags, so the admin can refresh
// exactly what changed (POST /api/revalidate). REVALIDATE_SECONDS is the safety net if a
// revalidation call is missed. Pages render per request (cheap: the data is cached), so an
// "API is down" page is never cached and the build never needs the API.
import "server-only";
import { unstable_noStore as noStore } from "next/cache";
import type { Product, ProductDetailResponse, ProductListQuery, ProductListResponse, TraceResponse, Variety } from "@kisa/shared";
import * as mock from "@/data/mock";

export type ProductFilters = Omit<ProductListQuery, "category">;

export const REVALIDATE_SECONDS = 300;

/** Cache tags. Every API fetch also carries CATALOGUE_TAG, so one call can refresh everything (e.g. a variety rename). */
export const CATALOGUE_TAG = "catalogue";
export const tags = {
  products: "products",
  varieties: "varieties",
  product: (slug: string) => `product:${slug}`,
  trace: (batchId: string) => `trace:${batchId}`,
};

/** The API could not be reached or answered with an error. Pages show a friendly state. */
export class CatalogueUnavailableError extends Error {
  constructor(path: string, cause?: unknown) {
    super(`Catalogue API unavailable: GET ${path}`, { cause });
    this.name = "CatalogueUnavailableError";
  }
}

export type Loaded<T> = { ok: true; data: T } | { ok: false };

/**
 * Runs a page's data calls; an unreachable API becomes { ok: false } so the page can show a
 * friendly state. Anything else is rethrown: that includes Next's own signals (notFound,
 * and the error noStore throws while building to mark the page as dynamic).
 */
export async function load<T>(fn: () => Promise<T>): Promise<Loaded<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    if (e instanceof CatalogueUnavailableError) return { ok: false };
    throw e;
  }
}

export const dataSource =(): "mock" | "api" => (process.env.DATA_SOURCE === "api" ? "api" : "mock");

const apiBase = () => `${(process.env.API_URL ?? "http://localhost:4000").replace(/\/+$/, "")}/api/v1`;

/** GET from the public API. Returns null for 404 (and 400: an id that can't exist). */
async function apiGet<T>(path: string, cacheTags: string[]): Promise<T | null> {
  noStore(); // render per request; the fetch below is still cached in the Data Cache
  let res: Response;
  try {
    res = await fetch(apiBase() + path, {
      headers: { accept: "application/json" },
      next: { revalidate: REVALIDATE_SECONDS, tags: [...cacheTags, CATALOGUE_TAG] },
    });
  } catch (e) {
    console.error(`[data] GET ${path} failed: ${e instanceof Error ? e.message : String(e)}`);
    throw new CatalogueUnavailableError(path, e);
  }
  if (res.status === 404 || res.status === 400) return null;
  if (!res.ok) {
    console.error(`[data] GET ${path} returned ${res.status}`);
    throw new CatalogueUnavailableError(path);
  }
  return (await res.json()) as T;
}

function query(f: ProductFilters): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) if (v !== undefined) q.set(k, String(v));
  const s = q.toString();
  return s ? `?${s}` : "";
}

/** Products on sale, with the same filters as GET /products. */
export async function getProducts(filters: ProductFilters = {}): Promise<Product[]> {
  if (dataSource() === "mock") return mock.listProducts(filters);
  const res = await apiGet<ProductListResponse>(`/products${query(filters)}`, [tags.products]);
  return res?.products ?? [];
}

/** One product with its batch's Quality Passport, or null if it isn't on sale. */
export async function getProduct(slug: string): Promise<ProductDetailResponse | null> {
  if (dataSource() === "mock") return mock.getProductDetail(slug) ?? null;
  return apiGet<ProductDetailResponse>(`/products/${encodeURIComponent(slug)}`, [tags.product(slug)]);
}

/** A batch's Quality Passport, or null if there is no such batch. */
export async function getTrace(batchId: string): Promise<TraceResponse | null> {
  if (dataSource() === "mock") return mock.getTrace(batchId) ?? null;
  return apiGet<TraceResponse>(`/trace/${encodeURIComponent(batchId)}`, [tags.trace(batchId)]);
}

export async function getVarieties(): Promise<Variety[]> {
  if (dataSource() === "mock") return mock.varieties;
  return (await apiGet<Variety[]>("/varieties", [tags.varieties])) ?? [];
}

/** The pack shown in the hero and linked from the footer: the first featured pack in stock. */
export const pickFeatured = (products: Product[]): Product | undefined => products.find((p) => p.featured && p.inStock) ?? products[0];

/**
 * generateStaticParams for product and Quality Passport pages. Mock: every page is pre-rendered.
 * API: one placeholder whose build-time render reaches noStore() before any fetch, so Next marks
 * the route dynamic (rendered per request from cached data). Without it, Next would treat the
 * route as static and fail at runtime when noStore() is called.
 */
const DYNAMIC_ROUTE_PROBE = "dynamic-route-probe";
export const staticProductSlugs = () => (dataSource() === "mock" ? mock.products.map((p) => p.id) : [DYNAMIC_ROUTE_PROBE]);
export const staticBatchIds = () => (dataSource() === "mock" ? mock.traceIds() : [DYNAMIC_ROUTE_PROBE.toUpperCase()]);
