/**
 * Seeds the catalogue from prisma/seed-data.json (exported from apps/web mock data),
 * plus Hyderabad delivery settings and the first admin user.
 *
 * Run: pnpm --filter @kisa/db db:seed   (Prisma loads packages/db/.env)
 *
 * Safe to re-run: everything is upserted. Re-runs never reset a batch's stock
 * (availableKg) or an existing admin's password.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import bcrypt from "bcryptjs";
import { FarmingMethod, Prisma, PrismaClient } from "@prisma/client";
import type { Batch, Category, Farmer, Partner, Product } from "@kisa/shared";

const prisma = new PrismaClient();

interface SeedData {
  categories: Pick<Category, "id" | "name" | "slug" | "partnerType" | "perishable" | "platformFeePerKg" | "packSizesKg">[];
  farmers: Farmer[];
  partners: Partner[];
  batches: Batch[];
  products: Product[];
}

const data: SeedData = JSON.parse(readFileSync(join(__dirname, "seed-data.json"), "utf8"));

const paise = (rupees: number) => Math.round(rupees * 100);
const date = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const addDays = (iso: string, days: number) => new Date(date(iso).getTime() + days * 86_400_000);

const METHOD: Record<Farmer["method"], FarmingMethod> = {
  conventional: "CONVENTIONAL",
  "low-chemical": "LOW_CHEMICAL",
  natural: "NATURAL",
};

// Fields every batch has; everything else crop-specific goes into `attributes`.
const COMMON_BATCH_KEYS = new Set([
  "id", "categoryId", "salesModel", "purchase", "farmerId", "partnerId", "variety",
  "harvestDate", "packedDate", "inputKg", "outputKg", "shelfLifeDays", "quality",
]);

// Starter list of serviceable Hyderabad pincodes; edit in the admin panel (step 7).
const PINCODES: { pincode: string; area: string }[] = [
  { pincode: "500001", area: "Abids" },
  { pincode: "500003", area: "Secunderabad" },
  { pincode: "500016", area: "Begumpet" },
  { pincode: "500032", area: "Gachibowli" },
  { pincode: "500033", area: "Jubilee Hills" },
  { pincode: "500034", area: "Banjara Hills" },
  { pincode: "500038", area: "Ameerpet" },
  { pincode: "500072", area: "Kukatpally" },
  { pincode: "500081", area: "Madhapur / HITEC City" },
  { pincode: "500084", area: "Kondapur" },
];

const SLOTS = [
  { id: "slot-morning", label: "Morning, 7–10 AM", startTime: "07:00", endTime: "10:00", capacity: 40, sortOrder: 1 },
  { id: "slot-evening", label: "Evening, 5–8 PM", startTime: "17:00", endTime: "20:00", capacity: 40, sortOrder: 2 },
];

async function seedCatalogue() {
  for (const c of data.categories) {
    const fields = {
      name: c.name,
      slug: c.slug,
      partnerType: c.partnerType,
      perishable: c.perishable,
      platformFeePerKgPaise: paise(c.platformFeePerKg),
      packSizesKg: c.packSizesKg,
    };
    await prisma.category.upsert({ where: { id: c.id }, create: { id: c.id, ...fields }, update: fields });
  }

  for (const f of data.farmers) {
    const fields = {
      name: f.name,
      village: f.village,
      district: f.district,
      state: f.state,
      acres: f.acres,
      yearsFarming: f.yearsFarming,
      method: METHOD[f.method],
      story: f.story,
      photoUrl: f.photo ?? null,
    };
    await prisma.farmer.upsert({ where: { id: f.id }, create: { id: f.id, ...fields }, update: fields });
  }

  for (const p of data.partners) {
    const fields = {
      type: p.type,
      name: p.name,
      town: p.town,
      district: p.district,
      state: p.state,
      processingFeePerKgPaise: paise(p.processingFeePerKg),
      certifications: p.certifications,
      established: p.established,
    };
    await prisma.partner.upsert({ where: { id: p.id }, create: { id: p.id, ...fields }, update: fields });
  }

  for (const b of data.batches) {
    const shelfLifeDays = "shelfLifeDays" in b ? b.shelfLifeDays : null;
    const attributes = Object.fromEntries(Object.entries(b).filter(([k]) => !COMMON_BATCH_KEYS.has(k)));
    // The mock marks some products sold out; their batch starts with no stock.
    const inStock = data.products.some((p) => p.batchId === b.id && p.inStock);
    const fields = {
      categoryId: b.categoryId,
      salesModel: b.salesModel,
      farmerId: b.farmerId,
      partnerId: b.partnerId,
      variety: b.variety,
      harvestDate: date(b.harvestDate),
      packedDate: date(b.packedDate),
      inputKg: b.inputKg,
      outputKg: b.outputKg,
      purchaseDate: b.purchase ? date(b.purchase.date) : null,
      purchasePricePerKgPaise: b.purchase ? paise(b.purchase.pricePerKg) : null,
      shelfLifeDays,
      expiresOn: shelfLifeDays ? addDays(b.packedDate, shelfLifeDays) : null,
      attributes: attributes as Prisma.InputJsonObject,
      quality: b.quality as unknown as Prisma.InputJsonObject,
    };
    await prisma.batch.upsert({
      where: { id: b.id },
      create: { id: b.id, ...fields, availableKg: inStock ? b.outputKg : 0 },
      update: fields, // never reset availableKg: it reflects real sales
    });
  }

  for (const p of data.products) {
    const b = p.priceBreakdown;
    const fields = {
      name: p.name,
      batchId: p.batchId,
      bagSizeKg: p.bagSizeKg,
      farmerSharePaise: paise(b.model === "FARMER_OWNED" ? b.farmerShare : b.paidToFarmer),
      partnerSharePaise: paise(b.model === "FARMER_OWNED" ? b.processingFee : b.partnerMargin),
      platformFeePaise: paise(b.platformFee),
      pricePaise: paise(p.price),
      description: p.description,
      tags: p.tags,
      featured: p.featured,
    };
    await prisma.product.upsert({ where: { slug: p.id }, create: { slug: p.id, ...fields }, update: fields });
  }
}

async function seedDelivery() {
  for (const { pincode, area } of PINCODES) {
    await prisma.serviceablePincode.upsert({ where: { pincode }, create: { pincode, area }, update: { area } });
  }
  for (const { id, ...fields } of SLOTS) {
    await prisma.deliverySlot.upsert({ where: { id }, create: { id, ...fields }, update: fields });
  }
}

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn("SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set: skipping admin user.");
    return;
  }
  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) return; // never overwrite a password that may have been changed
  await prisma.adminUser.create({
    data: { email, name: "Kisa Admin", role: "ADMIN", passwordHash: await bcrypt.hash(password, 12) },
  });
}

async function main() {
  await seedCatalogue();
  await seedDelivery();
  await seedAdmin();

  const counts = {
    categories: await prisma.category.count(),
    farmers: await prisma.farmer.count(),
    partners: await prisma.partner.count(),
    batches: await prisma.batch.count(),
    products: await prisma.product.count(),
    pincodes: await prisma.serviceablePincode.count(),
    slots: await prisma.deliverySlot.count(),
    admins: await prisma.adminUser.count(),
  };
  console.log("Seeded:", JSON.stringify(counts));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
