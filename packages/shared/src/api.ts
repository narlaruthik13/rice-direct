// Response shapes of apps/api. Money is in rupees and enums use the website's
// spellings, so the website can swap mock data for API calls with minimal changes.
import type { Batch, CategoryId, Farmer, Partner, PartnerType, Product } from "./types";

/** Business settings for a category. Display config (theme, copy, filters) stays in the website. */
export interface CategorySummary {
  id: CategoryId;
  name: string;
  slug: string;
  partnerType: PartnerType;
  perishable: boolean;
  platformFeePerKg: number;
  packSizesKg: number[];
}

/** Products plus the farmers and partners they reference, so a list renders without extra calls. */
export interface ProductListResponse {
  products: Product[];
  farmers: Farmer[];
  partners: Partner[];
}

export interface ProductDetailResponse {
  product: Product;
  batch: Batch;
  farmer: Farmer;
  partner: Partner;
}

/** What a pack's QR code opens: the batch, who grew and processed it, and its packs. */
export interface TraceResponse {
  batch: Batch;
  farmer: Farmer;
  partner: Partner;
  products: Product[];
}

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
  categoryId: CategoryId;
  variety: string;
  /** Names of the active packs sold from this batch. */
  products: string[];
  availableKg: number;
  /** Smallest active pack size of the batch, kg. */
  packSizeKg: number;
  packsLeft: number;
}

export interface DashboardExpiringItem {
  batchId: string;
  categoryId: CategoryId;
  variety: string;
  /** First date the batch is no longer sold (YYYY-MM-DD). */
  expiresOn: string;
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
  /** Perishable batches with stock that stop selling within 7 days. */
  expiringSoon: { count: number; items: DashboardExpiringItem[] };
}

// ---------- Admin management (step 5) ----------

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** A farmer as admins see it: the public shape plus contact, status and counts. */
export interface AdminFarmer extends Farmer {
  phone: string | null;
  photoUrl: string | null;
  isActive: boolean;
  batchCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPartner extends Partner {
  phone: string | null;
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
  farmerShare: number;
  partnerShare: number;
  platformFee: number;
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
  salesModel: "FARMER_OWNED" | "PARTNER_SOURCED";
  variety: string;
  farmer: { id: string; name: string };
  partner: { id: string; name: string; type: PartnerType };
  packedDate: string;
  expiresOn: string | null;
  /** Days until expiresOn (perishables only). */
  daysLeft: number | null;
  outputKg: number;
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
  harvestDate: string;
  inputKg: number;
  purchase: { date: string; pricePerKg: number } | null;
  shelfLifeDays: number | null;
  attributes: Record<string, unknown>;
  quality: Record<string, unknown>;
  /** True once any order includes this batch: salesModel, farmer, partner and outputKg are then locked. */
  hasOrders: boolean;
  lockedFields: string[];
  products: AdminProduct[];
  stockAdjustments: StockAdjustmentView[];
  audit: AuditEntry[];
  /** Business settings of the batch's category (pack sizes, platform fee). */
  category: CategorySummary;
}
