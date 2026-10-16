// Response shapes of apps/api. Money is in rupees; dates are YYYY-MM-DD.
// Public responses never include the mill or the mill price / Kisa margin split.
import type { CategoryId, Product, QualityPassport, RiceAge, RiceType, Variety } from "./types";

// ---------- Public catalogue ----------

/** Business settings for a category. Display copy stays in the website. */
export interface CategorySummary {
  id: CategoryId;
  name: string;
  slug: string;
  packSizesKg: number[];
  /** Default best-before: packed date + this many days. */
  shelfLifeDays: number;
}

export interface ProductListResponse {
  products: Product[];
}

export interface ProductDetailResponse {
  product: Product;
  passport: QualityPassport;
}

/** The Quality Passport a bag's QR code opens, with the packs from the same batch. */
export interface TraceResponse {
  passport: QualityPassport;
  products: Product[];
}

export type VarietyListResponse = Variety[];

// ---------- Auth ----------

export type AdminRole = "ADMIN" | "STAFF";

export interface AdminProfile {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AuthTokens {
  tokenType: "Bearer";
  accessToken: string;
  /** Seconds until the access token expires. */
  expiresIn: number;
  refreshToken: string;
  refreshExpiresIn: number;
}

export interface AdminLoginResponse extends AuthTokens {
  admin: AdminProfile;
}

export interface HealthResponse {
  status: "ok";
  database: "up";
  uptimeSeconds: number;
}

/** Every error response has this shape. Internal details are never included. */
export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
  requestId?: string;
  issues?: { path: string; message: string }[];
}

// ---------- Admin dashboard ----------

export interface DashboardProductItem {
  slug: string;
  name: string;
  batchId: string;
}

export interface DashboardStockItem {
  batchId: string;
  variety: string;
  /** Names of the active packs sold from this batch. */
  products: string[];
  availableKg: number;
  /** Smallest active pack size of the batch, kg. */
  packSizeKg: number;
  packsLeft: number;
}

export interface DashboardBestBeforeItem {
  batchId: string;
  variety: string;
  /** First date the batch is no longer sold (YYYY-MM-DD). */
  bestBefore: string;
  daysLeft: number;
  availableKg: number;
}

/** Each list holds at most 5 items; `count` is the full total. */
export interface DashboardSummary {
  /** Today in India (YYYY-MM-DD). */
  today: string;
  generatedAt: string;
  ordersToday: number;
  products: { active: number; inStock: number; soldOut: number };
  soldOut: { count: number; items: DashboardProductItem[] };
  /** Batches with at least 1 but fewer than 2 packs left. */
  lowStock: { count: number; items: DashboardStockItem[] };
  /** Batches with stock whose best-before date is within 30 days. */
  bestBeforeSoon: { count: number; items: DashboardBestBeforeItem[] };
}

// ---------- Admin management ----------

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** A partner mill (admin only; never public). */
export interface AdminMill {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  town: string;
  district: string;
  state: string;
  fssaiLicense: string | null;
  certifications: string[];
  isActive: boolean;
  batchCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminVariety extends Variety {
  isActive: boolean;
  batchCount: number;
  createdAt: string;
  updatedAt: string;
}

export type StockStatusValue = "in_stock" | "low" | "sold_out";

export interface AdminProduct {
  id: string;
  slug: string;
  name: string;
  batchId: string;
  bagSizeKg: number;
  /** ₹ per pack paid to the mill. */
  millPrice: number;
  /** ₹ per pack kept by Kisa. */
  kisaMargin: number;
  /** millPrice + kisaMargin: what customers pay. */
  price: number;
  description: string;
  tags: string[];
  featured: boolean;
  isActive: boolean;
  /** Packs the batch can still fill at this size. */
  packsAvailable: number;
  orderCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminBatchListItem {
  id: string;
  categoryId: CategoryId;
  variety: { id: string; name: string };
  mill: { id: string; name: string };
  riceType: RiceType | null;
  age: RiceAge | null;
  millingDate: string;
  packedDate: string;
  bestBefore: string;
  /** Days until bestBefore (negative once past). */
  daysLeft: number;
  packedKg: number;
  availableKg: number;
  stockStatus: StockStatusValue;
  productCount: number;
}

export interface StockAdjustmentView {
  id: string;
  deltaKg: number;
  reason: "DAMAGED" | "RECOUNT" | "RETURNED" | "OTHER";
  note: string | null;
  availableBefore: number;
  availableAfter: number;
  admin: { id: string; name: string };
  createdAt: string;
}

export interface AuditEntry {
  id: string;
  entity: string;
  entityId: string;
  action: "CREATE" | "UPDATE" | "DEACTIVATE" | "REACTIVATE" | "STOCK_ADJUST";
  /** { field: { before, after } } */
  changes: Record<string, { before: unknown; after: unknown }>;
  admin: { id: string; name: string };
  createdAt: string;
}

export interface AdminBatchDetail extends AdminBatchListItem {
  attributes: Record<string, unknown>;
  quality: Record<string, unknown>;
  /** True once any order includes this batch; the fields in lockedFields can then no longer change. */
  hasOrders: boolean;
  lockedFields: string[];
  products: AdminProduct[];
  stockAdjustments: StockAdjustmentView[];
  audit: AuditEntry[];
  /** Business settings of the batch's category (pack sizes, shelf life). */
  category: CategorySummary;
}
