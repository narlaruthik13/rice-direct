"use server";

// Server actions: every admin change goes through the admin's server, which calls the
// API with the session's token (the browser never sees it). Next.js checks that
// actions come from the admin's own pages. The API validates and enforces roles.
import type {
  AdminBatchDetail,
  AdminFarmer,
  AdminPartner,
  AdminProduct,
  BatchCreateInput,
  BatchUpdateInput,
  FarmerInput,
  PartnerInput,
  ProductInput,
  StockAdjustmentInput,
} from "@kisa/shared";
import { type ApiIssue, ApiRequestError, apiFetch } from "./api";

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

const send = <T>(path: string, method: "POST" | "PATCH", body?: unknown) =>
  run(() => apiFetch<T>(path, { method, body: JSON.stringify(body ?? {}) }));

const enc = encodeURIComponent;

export const createFarmer = async (input: FarmerInput) => send<AdminFarmer>("/admin/farmers", "POST", input);
export const updateFarmer = async (id: string, input: Partial<FarmerInput>) => send<AdminFarmer>(`/admin/farmers/${enc(id)}`, "PATCH", input);
export const setFarmerActive = async (id: string, active: boolean) =>
  send<AdminFarmer>(`/admin/farmers/${enc(id)}/${active ? "reactivate" : "deactivate"}`, "POST");

export const createPartner = async (input: PartnerInput) => send<AdminPartner>("/admin/partners", "POST", input);
export const updatePartner = async (id: string, input: Partial<PartnerInput>) => send<AdminPartner>(`/admin/partners/${enc(id)}`, "PATCH", input);
export const setPartnerActive = async (id: string, active: boolean) =>
  send<AdminPartner>(`/admin/partners/${enc(id)}/${active ? "reactivate" : "deactivate"}`, "POST");

export const createBatch = async (input: BatchCreateInput) => send<AdminBatchDetail>("/admin/batches", "POST", input);
export const updateBatch = async (id: string, input: BatchUpdateInput) => send<AdminBatchDetail>(`/admin/batches/${enc(id)}`, "PATCH", input);
export const adjustStock = async (id: string, input: StockAdjustmentInput) =>
  send<{ availableKg: number }>(`/admin/batches/${enc(id)}/stock`, "POST", input);

export const addProduct = async (batchId: string, input: ProductInput) => send<AdminProduct>(`/admin/batches/${enc(batchId)}/products`, "POST", input);
export const updateProduct = async (id: string, input: Partial<ProductInput>) => send<AdminProduct>(`/admin/products/${enc(id)}`, "PATCH", input);
export const setProductActive = async (id: string, active: boolean) =>
  send<AdminProduct>(`/admin/products/${enc(id)}/${active ? "reactivate" : "deactivate"}`, "POST");
