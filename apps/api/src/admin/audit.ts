import { Injectable } from "@nestjs/common";
import type { AuditAction, Prisma } from "@kisa/db";

export type AuditEntity = "Farmer" | "Partner" | "Batch" | "Product";
export type Changes = Record<string, { before: unknown; after: unknown }>;

/** Fields whose values differ between two snapshots, as { field: { before, after } }. */
export function diff(before: Record<string, unknown>, after: Record<string, unknown>, fields = Object.keys(after)): Changes {
  const out: Changes = {};
  for (const f of fields) {
    if (JSON.stringify(before[f] ?? null) !== JSON.stringify(after[f] ?? null)) {
      out[f] = { before: before[f] ?? null, after: after[f] ?? null };
    }
  }
  return out;
}

/** A snapshot as "created" changes: every field from null to its value. */
export const created = (after: Record<string, unknown>): Changes =>
  Object.fromEntries(Object.entries(after).map(([k, v]) => [k, { before: null, after: v ?? null }]));

/** Writes AdminAuditLog rows inside the caller's transaction, so a change and its audit commit together. */
@Injectable()
export class AuditService {
  async record(
    tx: Prisma.TransactionClient,
    entry: { adminId: string; entity: AuditEntity; entityId: string; action: AuditAction; changes: Changes },
  ) {
    await tx.adminAuditLog.create({
      data: {
        adminUserId: entry.adminId,
        entity: entry.entity,
        entityId: entry.entityId,
        action: entry.action,
        changes: entry.changes as Prisma.InputJsonObject,
      },
    });
  }
}
