-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DEACTIVATE', 'REACTIVATE', 'STOCK_ADJUST');

-- CreateEnum
CREATE TYPE "StockAdjustmentReason" AS ENUM ('DAMAGED', 'RECOUNT', 'RETURNED', 'OTHER');

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "changes" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockAdjustment" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "deltaKg" INTEGER NOT NULL,
    "reason" "StockAdjustmentReason" NOT NULL,
    "note" TEXT,
    "availableBefore" INTEGER NOT NULL,
    "availableAfter" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminAuditLog_entity_entityId_createdAt_idx" ON "AdminAuditLog"("entity", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_adminUserId_idx" ON "AdminAuditLog"("adminUserId");

-- CreateIndex
CREATE INDEX "StockAdjustment_batchId_createdAt_idx" ON "StockAdjustment"("batchId", "createdAt");

-- AddForeignKey
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAdjustment" ADD CONSTRAINT "StockAdjustment_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAdjustment" ADD CONSTRAINT "StockAdjustment_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- An adjustment always changes stock, and the recorded before/after must match it.
ALTER TABLE "StockAdjustment" ADD CONSTRAINT "StockAdjustment_delta_nonzero" CHECK ("deltaKg" <> 0);
ALTER TABLE "StockAdjustment" ADD CONSTRAINT "StockAdjustment_after_matches" CHECK ("availableAfter" = "availableBefore" + "deltaKg" AND "availableAfter" >= 0);
