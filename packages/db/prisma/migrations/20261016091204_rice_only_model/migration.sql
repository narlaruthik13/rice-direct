-- Rice-only Kisa brand model (pre-launch).
-- Removes farmers, onions/packhouses and the two sales models; partners become mills;
-- adds varieties; prices become mill price + Kisa margin.
--
-- Before launch the catalogue and order tables hold only seed/test data, so they are
-- cleared here and the seed is run again afterwards (also on production: run
-- `pnpm --filter @kisa/db db:seed` after `migrate deploy`). Admin users, sessions and
-- delivery settings (pincodes, slots, agents) are kept.

DELETE FROM "OrderEvent";
DELETE FROM "OrderItem";
DELETE FROM "Order";
DELETE FROM "Customer";
DELETE FROM "StockAdjustment";
DELETE FROM "AdminAuditLog";
DELETE FROM "Product";
DELETE FROM "Batch";
DELETE FROM "Category";

-- Old CHECK constraints (they reference columns removed below).
ALTER TABLE "Batch" DROP CONSTRAINT IF EXISTS "Batch_availableKg_nonnegative";
ALTER TABLE "Batch" DROP CONSTRAINT IF EXISTS "Batch_availableKg_le_outputKg";
ALTER TABLE "Batch" DROP CONSTRAINT IF EXISTS "Batch_kg_positive";
ALTER TABLE "Batch" DROP CONSTRAINT IF EXISTS "Batch_purchase_matches_model";
ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS "Product_price_is_sum";
ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS "Product_amounts_valid";
ALTER TABLE "Order" DROP CONSTRAINT IF EXISTS "Order_total_is_sum";

-- DropForeignKey
ALTER TABLE "Batch" DROP CONSTRAINT "Batch_farmerId_fkey";

-- DropForeignKey
ALTER TABLE "Batch" DROP CONSTRAINT "Batch_partnerId_fkey";

-- DropIndex
DROP INDEX "Batch_farmerId_idx";

-- DropIndex
DROP INDEX "Batch_partnerId_idx";

-- DropIndex
DROP INDEX "OrderItem_farmerId_idx";

-- DropIndex
DROP INDEX "OrderItem_partnerId_idx";

-- AlterTable
ALTER TABLE "Batch" DROP COLUMN "expiresOn",
DROP COLUMN "farmerId",
DROP COLUMN "harvestDate",
DROP COLUMN "inputKg",
DROP COLUMN "outputKg",
DROP COLUMN "partnerId",
DROP COLUMN "purchaseDate",
DROP COLUMN "purchasePricePerKgPaise",
DROP COLUMN "salesModel",
DROP COLUMN "shelfLifeDays",
DROP COLUMN "variety",
ADD COLUMN     "bestBefore" DATE NOT NULL,
ADD COLUMN     "millId" TEXT NOT NULL,
ADD COLUMN     "millingDate" DATE NOT NULL,
ADD COLUMN     "packedKg" INTEGER NOT NULL,
ADD COLUMN     "varietyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Category" DROP COLUMN "partnerType",
DROP COLUMN "perishable",
DROP COLUMN "platformFeePerKgPaise",
ADD COLUMN     "shelfLifeDays" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "farmerTotalPaise",
DROP COLUMN "partnerTotalPaise",
DROP COLUMN "platformTotalPaise",
ADD COLUMN     "kisaMarginTotalPaise" INTEGER NOT NULL,
ADD COLUMN     "millTotalPaise" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "farmerId",
DROP COLUMN "farmerSharePaise",
DROP COLUMN "partnerId",
DROP COLUMN "partnerSharePaise",
DROP COLUMN "platformFeePaise",
DROP COLUMN "salesModel",
ADD COLUMN     "kisaMarginPaise" INTEGER NOT NULL,
ADD COLUMN     "millId" TEXT NOT NULL,
ADD COLUMN     "millPricePaise" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "farmerSharePaise",
DROP COLUMN "partnerSharePaise",
DROP COLUMN "platformFeePaise",
ADD COLUMN     "kisaMarginPaise" INTEGER NOT NULL,
ADD COLUMN     "millPricePaise" INTEGER NOT NULL;

-- DropTable
DROP TABLE "Farmer";

-- DropTable
DROP TABLE "Partner";

-- DropEnum
DROP TYPE "FarmingMethod";

-- DropEnum
DROP TYPE "PartnerType";

-- DropEnum
DROP TYPE "SalesModel";

-- CreateTable
CREATE TABLE "Variety" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Variety_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mill" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactName" TEXT,
    "phone" TEXT,
    "town" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "fssaiLicense" TEXT,
    "certifications" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Variety_slug_key" ON "Variety"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Variety_categoryId_name_key" ON "Variety"("categoryId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Mill_phone_key" ON "Mill"("phone");

-- CreateIndex
CREATE INDEX "Batch_varietyId_idx" ON "Batch"("varietyId");

-- CreateIndex
CREATE INDEX "Batch_millId_idx" ON "Batch"("millId");

-- CreateIndex
CREATE INDEX "OrderItem_millId_idx" ON "OrderItem"("millId");

-- AddForeignKey
ALTER TABLE "Variety" ADD CONSTRAINT "Variety_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_varietyId_fkey" FOREIGN KEY ("varietyId") REFERENCES "Variety"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_millId_fkey" FOREIGN KEY ("millId") REFERENCES "Mill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- ---------- CHECK constraints (not expressible in schema.prisma) ----------

-- No overselling: stock stays between 0 and what was packed, even under concurrent orders.
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_availableKg_range" CHECK ("availableKg" >= 0 AND "availableKg" <= "packedKg");
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_packedKg_positive" CHECK ("packedKg" > 0);
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_dates_in_order" CHECK ("packedDate" >= "millingDate" AND "bestBefore" > "packedDate");

-- Price is always mill price + Kisa margin.
ALTER TABLE "Product" ADD CONSTRAINT "Product_price_is_sum" CHECK ("pricePaise" = "millPricePaise" + "kisaMarginPaise");
ALTER TABLE "Product" ADD CONSTRAINT "Product_amounts_valid" CHECK ("bagSizeKg" > 0 AND "millPricePaise" >= 0 AND "kisaMarginPaise" >= 0);

ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_price_is_sum" CHECK ("unitPricePaise" = "millPricePaise" + "kisaMarginPaise");
ALTER TABLE "Order" ADD CONSTRAINT "Order_total_is_sum" CHECK (
  "totalPaise" = "millTotalPaise" + "kisaMarginTotalPaise" + "deliveryFeePaise"
);
