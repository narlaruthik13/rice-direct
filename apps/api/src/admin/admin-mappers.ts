// Database rows → ADMIN response shapes (@kisa/shared). Admin views include the mill and
// the mill price / Kisa margin split; public views (../catalogue/mappers.ts) never do.
import type { AdminAuditLog, AdminUser, Batch, Mill, Product, StockAdjustment, Variety } from "@kisa/db";
import type { AdminMill, AdminProduct, AdminVariety, AuditEntry, RiceAge, RiceType, StockAdjustmentView, StockStatusValue } from "@kisa/shared";
import { isoDate, toRupees } from "./common";

export const toAdminMill = (m: Mill & { _count: { batches: number } }): AdminMill => ({
  id: m.id,
  name: m.name,
  contactName: m.contactName,
  phone: m.phone,
  town: m.town,
  district: m.district,
  state: m.state,
  fssaiLicense: m.fssaiLicense,
  certifications: m.certifications,
  isActive: m.isActive,
  batchCount: m._count.batches,
  createdAt: m.createdAt.toISOString(),
  updatedAt: m.updatedAt.toISOString(),
});

export const toAdminVariety = (v: Variety & { _count: { batches: number } }): AdminVariety => ({
  id: v.id,
  name: v.name,
  slug: v.slug,
  categoryId: v.categoryId,
  isActive: v.isActive,
  batchCount: v._count.batches,
  createdAt: v.createdAt.toISOString(),
  updatedAt: v.updatedAt.toISOString(),
});

export const toAdminProduct = (p: Product & { _count?: { orderItems: number } }, b: Pick<Batch, "availableKg">): AdminProduct => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  batchId: p.batchId,
  bagSizeKg: p.bagSizeKg,
  millPrice: toRupees(p.millPricePaise),
  kisaMargin: toRupees(p.kisaMarginPaise),
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

export const riceAttrs = (b: Pick<Batch, "attributes">) => {
  const a = (b.attributes ?? {}) as { riceType?: RiceType; age?: RiceAge };
  return { riceType: a.riceType ?? null, age: a.age ?? null };
};

/** Batch fields in API units, for audit snapshots. */
export const batchSnapshot = (b: Batch) => ({
  categoryId: b.categoryId,
  varietyId: b.varietyId,
  millId: b.millId,
  millingDate: isoDate(b.millingDate),
  packedDate: isoDate(b.packedDate),
  bestBefore: isoDate(b.bestBefore),
  packedKg: b.packedKg,
  availableKg: b.availableKg,
  attributes: (b.attributes ?? {}) as Record<string, unknown>,
  quality: (b.quality ?? {}) as Record<string, unknown>,
});

export const productSnapshot = (p: Product) => ({
  slug: p.slug,
  name: p.name,
  batchId: p.batchId,
  bagSizeKg: p.bagSizeKg,
  millPrice: toRupees(p.millPricePaise),
  kisaMargin: toRupees(p.kisaMarginPaise),
  price: toRupees(p.pricePaise),
  description: p.description,
  tags: p.tags,
  featured: p.featured,
  isActive: p.isActive,
});
