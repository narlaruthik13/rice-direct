/**
 * Seeds the rice-only catalogue (category, varieties, mills, batches, products),
 * Hyderabad delivery settings and the first admin user.
 *
 * Run: pnpm --filter @kisa/db db:seed   (Prisma loads packages/db/.env)
 *
 * Safe to re-run: everything is upserted. Re-runs never reset a batch's stock
 * (availableKg) or an existing admin's password. Mill names are fictional.
 */
import bcrypt from "bcryptjs";
import { Prisma, PrismaClient } from "@prisma/client";
import { RiceAttributesSchema, RiceQualitySchema, type RiceAge, type RiceQuality, type RiceType } from "@kisa/shared";

const prisma = new PrismaClient();

const paise = (rupees: number) => Math.round(rupees * 100);
const date = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const addDays = (iso: string, days: number) => new Date(date(iso).getTime() + days * 86_400_000);

const RICE = { id: "rice", name: "Rice", slug: "rice", packSizesKg: [5, 10, 25], shelfLifeDays: 365 };

const VARIETIES = [
  { id: "variety-sona-masoori", name: "Sona Masoori", slug: "sona-masoori" },
  { id: "variety-bpt-5204", name: "BPT 5204", slug: "bpt-5204" },
  { id: "variety-hmt", name: "HMT", slug: "hmt" },
];

// Admin-only: mills are never shown to customers.
const MILLS = [
  { id: "mill-godavari", name: "Sri Godavari Rice Mill", contactName: "K. Satyanarayana", town: "Mandapeta", district: "Konaseema", state: "Andhra Pradesh", certifications: ["FSSAI Licensed", "Sortex colour sorting"] },
  { id: "mill-kakatiya", name: "Kakatiya Agro Mill", contactName: "R. Venugopal", town: "Karimnagar", district: "Karimnagar", state: "Telangana", certifications: ["FSSAI Licensed", "ISO 22000"] },
  { id: "mill-miryalaguda", name: "Miryalaguda Parboil Works", contactName: "S. Narsimha", town: "Miryalaguda", district: "Nalgonda", state: "Telangana", certifications: ["FSSAI Licensed"] },
];

interface SeedBatch {
  id: string;
  varietyId: string;
  millId: string;
  riceType: RiceType;
  age: RiceAge;
  millingDate: string;
  packedDate: string;
  packedKg: number;
  /** Starting stock; defaults to packedKg. */
  availableKg?: number;
  quality: RiceQuality;
}

const lab = (testedBy: string, testedOn: string, grade: RiceQuality["grade"]) => ({ testedBy, testedOn, grade });

const BATCHES: SeedBatch[] = [
  { id: "KS-2026-0904-SM", varietyId: "variety-sona-masoori", millId: "mill-godavari", riceType: "RAW", age: "NEW", millingDate: "2026-09-02", packedDate: "2026-09-04", packedKg: 2000, quality: { moisturePct: 13.1, brokenPct: 2.4, foreignMatterPct: 0.1, grainLengthMm: 5.1, ...lab("Kisa QC lab, Hyderabad", "2026-09-05", "A+") } },
  { id: "KS-2026-0410-SM", varietyId: "variety-sona-masoori", millId: "mill-godavari", riceType: "RAW", age: "AGED", millingDate: "2026-04-08", packedDate: "2026-04-10", packedKg: 1500, quality: { moisturePct: 12.2, brokenPct: 2.1, foreignMatterPct: 0.1, grainLengthMm: 5.2, ...lab("Kisa QC lab, Hyderabad", "2026-04-11", "Premium") } },
  { id: "KS-2026-0915-SM", varietyId: "variety-sona-masoori", millId: "mill-kakatiya", riceType: "STEAM", age: "NEW", millingDate: "2026-09-13", packedDate: "2026-09-15", packedKg: 1200, quality: { moisturePct: 12.8, brokenPct: 1.6, foreignMatterPct: 0.05, grainLengthMm: 5.0, ...lab("Kisa QC lab, Hyderabad", "2026-09-16", "A+") } },
  { id: "KS-2026-0820-BP", varietyId: "variety-bpt-5204", millId: "mill-kakatiya", riceType: "RAW", age: "NEW", millingDate: "2026-08-18", packedDate: "2026-08-20", packedKg: 1800, quality: { moisturePct: 13.0, brokenPct: 2.6, foreignMatterPct: 0.1, grainLengthMm: 5.0, ...lab("Kisa QC lab, Hyderabad", "2026-08-21", "A") } },
  { id: "KS-2026-0705-BP", varietyId: "variety-bpt-5204", millId: "mill-miryalaguda", riceType: "BOILED", age: "AGED", millingDate: "2026-07-03", packedDate: "2026-07-05", packedKg: 1200, quality: { moisturePct: 12.0, brokenPct: 1.9, foreignMatterPct: 0.05, grainLengthMm: 5.0, ...lab("Kisa QC lab, Hyderabad", "2026-07-06", "A+") } },
  { id: "KS-2026-0925-HM", varietyId: "variety-hmt", millId: "mill-kakatiya", riceType: "RAW", age: "NEW", millingDate: "2026-09-23", packedDate: "2026-09-25", packedKg: 1000, quality: { moisturePct: 13.2, brokenPct: 2.8, foreignMatterPct: 0.1, grainLengthMm: 4.9, ...lab("Kisa QC lab, Hyderabad", "2026-09-26", "A") } },
  // Sold out: shows how an out-of-stock pack looks.
  { id: "KS-2026-0610-HM", varietyId: "variety-hmt", millId: "mill-miryalaguda", riceType: "STEAM", age: "AGED", millingDate: "2026-06-08", packedDate: "2026-06-10", packedKg: 800, availableKg: 0, quality: { moisturePct: 12.1, brokenPct: 2.0, foreignMatterPct: 0.05, grainLengthMm: 4.9, ...lab("Kisa QC lab, Hyderabad", "2026-06-11", "A+") } },
];

interface SeedProduct {
  slug: string;
  name: string;
  batchId: string;
  bagSizeKg: number;
  millPrice: number;
  kisaMargin: number;
  description: string;
  tags: string[];
  featured?: boolean;
}

const PRODUCTS: SeedProduct[] = [
  { slug: "sona-masoori-raw-new-5kg", name: "Sona Masoori, Raw", batchId: "KS-2026-0904-SM", bagSizeKg: 5, millPrice: 290, kisaMargin: 45, description: "Light, everyday Sona Masoori from this season's crop. Soft and separate for daily meals.", tags: ["Everyday", "New crop"] },
  { slug: "sona-masoori-raw-new-10kg", name: "Sona Masoori, Raw", batchId: "KS-2026-0904-SM", bagSizeKg: 10, millPrice: 570, kisaMargin: 80, description: "Light, everyday Sona Masoori from this season's crop. The family's monthly bag.", tags: ["Everyday", "New crop"], featured: true },
  { slug: "sona-masoori-raw-aged-10kg", name: "Aged Sona Masoori, Raw", batchId: "KS-2026-0410-SM", bagSizeKg: 10, millPrice: 620, kisaMargin: 90, description: "Six months of careful storage gives this Sona Masoori a fluffy, non-sticky cook.", tags: ["Aged 6 months", "Fluffy"], featured: true },
  { slug: "sona-masoori-raw-aged-25kg", name: "Aged Sona Masoori, Raw", batchId: "KS-2026-0410-SM", bagSizeKg: 25, millPrice: 1500, kisaMargin: 200, description: "Six months aged for a fluffy cook. The value bag for big kitchens.", tags: ["Aged 6 months", "Family pack"] },
  { slug: "sona-masoori-steam-new-10kg", name: "Sona Masoori, Steam", batchId: "KS-2026-0915-SM", bagSizeKg: 10, millPrice: 590, kisaMargin: 80, description: "Steamed before milling, so the grains stay firm and cook evenly.", tags: ["Steam", "Firm grains"] },
  { slug: "bpt-5204-raw-new-10kg", name: "BPT 5204, Raw", batchId: "KS-2026-0820-BP", bagSizeKg: 10, millPrice: 540, kisaMargin: 75, description: "Samba Masuri from the new crop: slender grains for everyday rice and pulihora.", tags: ["Everyday", "New crop"] },
  { slug: "bpt-5204-raw-new-25kg", name: "BPT 5204, Raw", batchId: "KS-2026-0820-BP", bagSizeKg: 25, millPrice: 1300, kisaMargin: 175, description: "Samba Masuri from the new crop, in the 25 kg value bag.", tags: ["Family pack", "Great value"] },
  { slug: "bpt-5204-boiled-aged-10kg", name: "Aged BPT 5204, Boiled", batchId: "KS-2026-0705-BP", bagSizeKg: 10, millPrice: 560, kisaMargin: 80, description: "Parboiled and aged: holds its shape, stays separate and keeps well after cooking.", tags: ["Boiled", "Aged"], featured: true },
  { slug: "hmt-raw-new-5kg", name: "HMT, Raw", batchId: "KS-2026-0925-HM", bagSizeKg: 5, millPrice: 310, kisaMargin: 45, description: "Short, soft HMT grains, a Telangana favourite for everyday meals.", tags: ["Everyday", "New crop"] },
  { slug: "hmt-raw-new-10kg", name: "HMT, Raw", batchId: "KS-2026-0925-HM", bagSizeKg: 10, millPrice: 600, kisaMargin: 85, description: "Short, soft HMT grains, a Telangana favourite. The monthly bag.", tags: ["Everyday", "New crop"], featured: true },
  { slug: "hmt-steam-aged-10kg", name: "Aged HMT, Steam", batchId: "KS-2026-0610-HM", bagSizeKg: 10, millPrice: 640, kisaMargin: 90, description: "Steamed and aged HMT: firm, fragrant and fluffy.", tags: ["Steam", "Aged"] },
];

// Starter list of serviceable Hyderabad pincodes; edit in the admin panel.
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
  const { id, ...category } = RICE;
  await prisma.category.upsert({ where: { id }, create: RICE, update: category });

  for (const v of VARIETIES) {
    await prisma.variety.upsert({ where: { id: v.id }, create: { ...v, categoryId: RICE.id }, update: { name: v.name, slug: v.slug } });
  }
  for (const { id: millId, ...m } of MILLS) {
    await prisma.mill.upsert({ where: { id: millId }, create: { id: millId, ...m }, update: m });
  }

  for (const b of BATCHES) {
    // The same rules the API applies, so seed data is always valid.
    const attributes = RiceAttributesSchema.parse({ riceType: b.riceType, age: b.age });
    const quality = RiceQualitySchema.parse(b.quality);
    const fields = {
      categoryId: RICE.id,
      varietyId: b.varietyId,
      millId: b.millId,
      millingDate: date(b.millingDate),
      packedDate: date(b.packedDate),
      bestBefore: addDays(b.packedDate, RICE.shelfLifeDays),
      packedKg: b.packedKg,
      attributes: attributes as Prisma.InputJsonObject,
      quality: quality as Prisma.InputJsonObject,
    };
    await prisma.batch.upsert({
      where: { id: b.id },
      create: { id: b.id, ...fields, availableKg: b.availableKg ?? b.packedKg },
      update: fields, // never reset availableKg: it reflects real sales
    });
  }

  for (const p of PRODUCTS) {
    const fields = {
      name: p.name,
      batchId: p.batchId,
      bagSizeKg: p.bagSizeKg,
      millPricePaise: paise(p.millPrice),
      kisaMarginPaise: paise(p.kisaMargin),
      pricePaise: paise(p.millPrice + p.kisaMargin),
      description: p.description,
      tags: p.tags,
      featured: p.featured ?? false,
    };
    await prisma.product.upsert({ where: { slug: p.slug }, create: { slug: p.slug, ...fields }, update: fields });
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
    varieties: await prisma.variety.count(),
    mills: await prisma.mill.count(),
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
