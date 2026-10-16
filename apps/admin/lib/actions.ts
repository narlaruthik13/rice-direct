"use server";

// Server actions: every admin change goes through the admin's server, which calls the
// API with the session's token (the browser never sees it). Next.js checks that
// actions come from the admin's own pages. The API validates and enforces roles.
import type {
  AdminBatchDetail,
  AdminMill,
  AdminProduct,
  AdminVariety,
  BatchCreateInput,
  BatchUpdateInput,
  MillInput,
  ProductInput,
  StockAdjustmentInput,
  VarietyInput,
} from "@kisa/shared";
import { type ApiIssue, ApiRequestError, apiFetch } from "./api";
import { revalidateWeb, webTags } from "./revalidate-web";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; message: string; issues?: ApiIssue[] };

/** API errors become results the form can show; anything else (including redirects) propagates. */
async function run<T>(call: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await call() };
  } catch (e) {
    if (e instanceof ApiRequestError) {
      const message = e.status === 403 ? "Only admins can make this change." : e.message;
      return { ok: false, status: e.status, message, issues: e.issues };
    }
    throw e;
  }
}

/**
 * Sends a change to the API. On success, `tagsFor` names the website pages to refresh
 * (catalogue changes only; mills never appear on the website).
 */
async function send<T>(path: string, method: "POST" | "PATCH", body?: unknown, tagsFor?: (data: T) => string[] | Promise<string[]>) {
  const result = await run(() => apiFetch<T>(path, { method, body: JSON.stringify(body ?? {}) }));
  if (result.ok && tagsFor) await revalidateWeb(await tagsFor(result.data));
  return result;
}

/** Tags for a batch whose stock changed: the batch's packs are looked up (best effort). */
async function stockTags(batchId: string): Promise<string[]> {
  try {
    return webTags.batch(await apiFetch<AdminBatchDetail>(`/admin/batches/${enc(batchId)}`));
  } catch {
    return ["products", `trace:${batchId}`];
  }
}

const enc = encodeURIComponent;

export const createMill = async (input: MillInput) => send<AdminMill>("/admin/mills", "POST", input);
export const updateMill = async (id: string, input: Partial<MillInput>) => send<AdminMill>(`/admin/mills/${enc(id)}`, "PATCH", input);
export const setMillActive = async (id: string, active: boolean) =>
  send<AdminMill>(`/admin/mills/${enc(id)}/${active ? "reactivate" : "deactivate"}`, "POST");

export const createVariety = async (input: VarietyInput) => send<AdminVariety>("/admin/varieties", "POST", input, webTags.varieties);
export const renameVariety = async (id: string, name: string) =>
  send<AdminVariety>(`/admin/varieties/${enc(id)}`, "PATCH", { name }, webTags.varieties);
export const setVarietyActive = async (id: string, active: boolean) =>
  send<AdminVariety>(`/admin/varieties/${enc(id)}/${active ? "reactivate" : "deactivate"}`, "POST", undefined, webTags.varieties);

export const createBatch = async (input: BatchCreateInput) => send<AdminBatchDetail>("/admin/batches", "POST", input, webTags.batch);
export const updateBatch = async (id: string, input: BatchUpdateInput) =>
  send<AdminBatchDetail>(`/admin/batches/${enc(id)}`, "PATCH", input, webTags.batch);
export const adjustStock = async (id: string, input: StockAdjustmentInput) =>
  send<{ availableKg: number }>(`/admin/batches/${enc(id)}/stock`, "POST", input, () => stockTags(id));

export const addProduct = async (batchId: string, input: ProductInput) =>
  send<AdminProduct>(`/admin/batches/${enc(batchId)}/products`, "POST", input, webTags.product);
export const updateProduct = async (id: string, input: Partial<ProductInput>) =>
  send<AdminProduct>(`/admin/products/${enc(id)}`, "PATCH", input, webTags.product);
export const setProductActive = async (id: string, active: boolean) =>
  send<AdminProduct>(`/admin/products/${enc(id)}/${active ? "reactivate" : "deactivate"}`, "POST", undefined, webTags.product);
