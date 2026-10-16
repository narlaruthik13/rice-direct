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
