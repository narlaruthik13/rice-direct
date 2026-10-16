// Mock data in the PUBLIC API's exact shapes, captured from the API by
// scripts/snapshot-api.mjs (see that file to refresh it). Pages read data only
// through these helpers, so connecting to the API swaps the data source here.
//
// The helpers mirror the endpoints:
//   categories        GET /categories
//   varieties         GET /varieties
//   listProducts()    GET /products (?riceType, variety, age, packSize, inStock)
//   getProductDetail  GET /products/:slug
//   getTrace          GET /trace/:batchId
import type { CategorySummary, Product, ProductDetailResponse, ProductListQuery, TraceResponse, Variety } from "@kisa/shared";
import snapshot from "./api-snapshot.json";

interface Snapshot {
  categories: CategorySummary[];
  varieties: Variety[];
  products: Product[];
  traces: Record<string, TraceResponse>;
}

const data = snapshot as unknown as Snapshot;

export const categories: CategorySummary[] = data.categories;
export const varieties: Variety[] = data.varieties;
export const products: Product[] = data.products;

/** Same filters as GET /products. */
export function listProducts(q: Omit<ProductListQuery, "category"> = {}): Product[] {
  return products.filter(
    (p) =>
      (!q.riceType || p.riceType === q.riceType) &&
      (!q.variety || p.variety.slug === q.variety) &&
      (!q.age || p.age === q.age) &&
      (!q.packSize || p.bagSizeKg === q.packSize) &&
      (q.inStock === undefined || p.inStock === q.inStock),
  );
}

export const getProduct = (slug: string): Product | undefined => products.find((p) => p.id === slug);

export function getProductDetail(slug: string): ProductDetailResponse | undefined {
  const product = getProduct(slug);
  const trace = product && data.traces[product.batchId];
  return product && trace ? { product, passport: trace.passport } : undefined;
}

export const getTrace = (batchId: string): TraceResponse | undefined => data.traces[batchId];

export const traceIds = (): string[] => Object.keys(data.traces);
