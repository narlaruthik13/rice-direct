// Database rows → admin response shapes (@kisa/shared). Rupees, YYYY-MM-DD dates,
// and the website's spellings, like the public catalogue.
import type {
  AdminUser,
  Batch,
  Farmer,
  Partner,
  Product,
  StockAdjustment,
  AdminAuditLog,
} from "@kisa/db";
import type {
  AdminFarmer,
  AdminPartner,
  AdminProduct,
  AuditEntry,
  CategoryId,
  StockAdjustmentView,
  StockStatusValue,
} from "@kisa/shared";
import { toFarmer, toPartner } from "../catalogue/mappers";
import { isoDate, toRupees } from "./common";

export const toAdminFarmer = (f: Farmer & { _count: { batches: number } }): AdminFarmer => ({
  ...toFarmer(f),
  phone: f.phone,
  photoUrl: f.photoUrl,
  isActive: f.isActive,
  batchCount: f._count.batches,
  createdAt: f.createdAt.toISOString(),
  updatedAt: f.updatedAt.toISOString(),
});

export const toAdminPartner = (p: Partner & { _count: { batches: number } }): AdminPartner => ({
  ...toPartner(p),
  phone: p.phone,
  isActive: p.isActive,
  batchCount: p._count.batches,
  createdAt: p.createdAt.toISOString(),
  updatedAt: p.updatedAt.toISOString(),
});

export const toAdminProduct = (p: Product & { _count?: { orderItems: number } }, b: Pick<Batch, "availableKg">): AdminProduct => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  batchId: p.batchId,
  bagSizeKg: p.bagSizeKg,
  farmerShare: toRupees(p.farmerSharePaise),
  partnerShare: toRupees(p.partnerSharePaise),
  platformFee: toRupees(p.platformFeePaise),
  price: toRupees(p.pricePaise),
  description: p.description,
  tags: p.tags,
  featured: p.featured,
  isActive: p.isActive,
  packsAvailable: Math.floor(b.availableKg / p.bagSizeKg),
  orderCount: p._count?.orderItems ?? 0,
  createdAt: p.createdAt.toISOString(),
  updatedAt: p.updatedAt.toISOString(),
});

/**
 * Stock status from the smallest active pack: sold out under 1 pack, low under 2.
 * A batch with no active packs is in stock while it has any kg left.
 */
export function stockStatus(availableKg: number, activePackSizes: number[]): StockStatusValue {
  if (activePackSizes.length === 0) return availableKg > 0 ? "in_stock" : "sold_out";
  const packs = Math.floor(availableKg / Math.min(...activePackSizes));
  return packs < 1 ? "sold_out" : packs < 2 ? "low" : "in_stock";
}

export const toStockAdjustment = (s: StockAdjustment & { adminUser: Pick<AdminUser, "id" | "name"> }): StockAdjustmentView => ({
  id: s.id,
  deltaKg: s.deltaKg,
  reason: s.reason,
  note: s.note,
  availableBefore: s.availableBefore,
  availableAfter: s.availableAfter,
  admin: { id: s.adminUser.id, name: s.adminUser.name },
  createdAt: s.createdAt.toISOString(),
});

export const toAuditEntry = (a: AdminAuditLog & { adminUser: Pick<AdminUser, "id" | "name"> }): AuditEntry => ({
  id: a.id,
  entity: a.entity,
  entityId: a.entityId,
  action: a.action,
  changes: a.changes as AuditEntry["changes"],
  admin: { id: a.adminUser.id, name: a.adminUser.name },
  createdAt: a.createdAt.toISOString(),
});

/** Batch fields in API units, for audit snapshots and the detail view. */
export const batchSnapshot = (b: Batch) => ({
  categoryId: b.categoryId as CategoryId,
  salesModel: b.salesModel,
  farmerId: b.farmerId,
  partnerId: b.partnerId,
  variety: b.variety,
  harvestDate: isoDate(b.harvestDate),
  packedDate: isoDate(b.packedDate),
  inputKg: b.inputKg,
  outputKg: b.outputKg,
  availableKg: b.availableKg,
  purchase:
    b.purchaseDate && b.purchasePricePerKgPaise !== null
      ? { date: isoDate(b.purchaseDate), pricePerKg: toRupees(b.purchasePricePerKgPaise) }
      : null,
  shelfLifeDays: b.shelfLifeDays,
  expiresOn: b.expiresOn ? isoDate(b.expiresOn) : null,
  attributes: (b.attributes ?? {}) as Record<string, unknown>,
  quality: (b.quality ?? {}) as Record<string, unknown>,
});

export const productSnapshot = (p: Product) => ({
  slug: p.slug,
  name: p.name,
  batchId: p.batchId,
  bagSizeKg: p.bagSizeKg,
  farmerShare: toRupees(p.farmerSharePaise),
  partnerShare: toRupees(p.partnerSharePaise),
  platformFee: toRupees(p.platformFeePaise),
  price: toRupees(p.pricePaise),
  description: p.description,
  tags: p.tags,
  featured: p.featured,
  isActive: p.isActive,
});
