// Admin management of mills, varieties, batches, products and stock (rice-only model).
// Creates its own ADMIN and STAFF users and test records (unique per run), and removes
// everything it created afterwards. Seeded data is only read.
import "../src/config/load-env"; // first, as in main.ts
import { randomUUID } from "node:crypto";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { Test } from "@nestjs/testing";
import bcrypt from "bcryptjs";
import request from "supertest";
import type { AdminBatchDetail, AdminBatchListItem, AdminMill, AdminVariety, BatchCreateInput, Paginated } from "@kisa/shared";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/app.setup";
import { PrismaService } from "../src/prisma/prisma.service";

const run = randomUUID().slice(0, 6);
const TAG = `E2E${run}`; // in names, so searches find only this run's records
const users = {
  admin: { email: `e2e-admin-${run}@kisa.test`, password: `Pw-${randomUUID()}`, role: "ADMIN" as const },
  staff: { email: `e2e-staff-${run}@kisa.test`, password: `Pw-${randomUUID()}`, role: "STAFF" as const },
};

const millBody = {
  name: `Mill ${TAG}`,
  contactName: "Test Contact",
  phone: "9876543210",
  town: "Suryapet",
  district: "Suryapet",
  state: "Telangana",
  fssaiLicense: "12345678901234",
  certifications: ["FSSAI Licensed"],
};

const quality = { moisturePct: 12.8, brokenPct: 2.2, foreignMatterPct: 0.1, grainLengthMm: 5.1, testedBy: "Kisa QC lab", testedOn: "2026-09-02", grade: "A" };
const pack = { name: `Test Rice ${TAG}`, bagSizeKg: 10, millPrice: 560, kisaMargin: 75, price: 635, description: "Test pack of new-crop rice." };

describe("Admin catalogue (e2e)", () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  const token: Record<keyof typeof users, string> = { admin: "", staff: "" };
  const adminIds: string[] = [];
  const created = { mills: [] as string[], varieties: [] as string[], batches: [] as string[], orders: [] as string[], customers: [] as string[] };

  const api = () => request(app.getHttpServer());
  const as = (who: keyof typeof users) => ({
    get: (url: string) => api().get(`/api/v1${url}`).set("Authorization", `Bearer ${token[who]}`),
    post: (url: string, body?: object) => api().post(`/api/v1${url}`).set("Authorization", `Bearer ${token[who]}`).send(body ?? {}),
    patch: (url: string, body: object) => api().patch(`/api/v1${url}`).set("Authorization", `Bearer ${token[who]}`).send(body),
  });
  const auditRows = (entityId: string) => prisma.adminAuditLog.findMany({ where: { entityId }, orderBy: { createdAt: "asc" } });

  const riceBatch = (overrides: Partial<BatchCreateInput> = {}): BatchCreateInput => ({
    categoryId: "rice",
    varietyId: created.varieties[0],
    millId: created.mills[0],
    millingDate: "2026-09-01",
    packedDate: "2026-09-03",
    packedKg: 650,
    attributes: { riceType: "RAW", age: "NEW" },
    quality,
    products: [],
    ...overrides,
  });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);

    for (const [key, u] of Object.entries(users) as [keyof typeof users, (typeof users)["admin"]][]) {
      const a = await prisma.adminUser.create({
        data: { email: u.email, name: `E2E ${u.role}`, role: u.role, passwordHash: await bcrypt.hash(u.password, 10) },
      });
      adminIds.push(a.id);
      const res = await api().post("/api/v1/auth/admin/login").send({ email: u.email, password: u.password }).expect(200);
      token[key] = res.body.accessToken;
    }
  });

  afterAll(async () => {
    await prisma.orderItem.deleteMany({ where: { orderId: { in: created.orders } } });
    await prisma.order.deleteMany({ where: { id: { in: created.orders } } });
    await prisma.customer.deleteMany({ where: { id: { in: created.customers } } });
    await prisma.stockAdjustment.deleteMany({ where: { adminUserId: { in: adminIds } } });
    await prisma.adminAuditLog.deleteMany({ where: { adminUserId: { in: adminIds } } });
    await prisma.product.deleteMany({ where: { batchId: { in: created.batches } } });
    await prisma.batch.deleteMany({ where: { id: { in: created.batches } } });
    await prisma.variety.deleteMany({ where: { id: { in: created.varieties } } });
    await prisma.mill.deleteMany({ where: { id: { in: created.mills } } });
    await prisma.adminUser.deleteMany({ where: { id: { in: adminIds } } });
    await app.close();
  });

  describe("farmers are gone", () => {
    it("has no farmer or partner endpoints", async () => {
      await as("admin").get("/admin/farmers").expect(404);
      await as("admin").get("/admin/partners").expect(404);
    });
  });

  describe("mills", () => {
    it("STAFF can view but not create", async () => {
      await as("staff").get("/admin/mills").expect(200);
      await as("staff").post("/admin/mills", millBody).expect(403);
    });

    it("validates the mill form", async () => {
      const res = await as("admin").post("/admin/mills", { ...millBody, phone: "12345", fssaiLicense: "abc" }).expect(400);
      expect(res.body.issues.map((i: { path: string }) => i.path).sort()).toEqual(["fssaiLicense", "phone"]);
    });

    it("ADMIN creates, reads, searches, updates, deactivates and reactivates a mill, with audit rows", async () => {
      const m: AdminMill = (await as("admin").post("/admin/mills", millBody).expect(201)).body;
      created.mills.push(m.id);
      expect(m).toMatchObject({ name: millBody.name, isActive: true, batchCount: 0, fssaiLicense: "12345678901234" });

      expect((await as("staff").get(`/admin/mills/${m.id}`).expect(200)).body.id).toBe(m.id);
      const list: Paginated<AdminMill> = (await as("admin").get(`/admin/mills?search=${TAG}`).expect(200)).body;
      expect(list.items.map((x) => x.id)).toEqual([m.id]);

      await as("staff").patch(`/admin/mills/${m.id}`, { town: "Kodad" }).expect(403);
      const upd = await as("admin").patch(`/admin/mills/${m.id}`, { town: "Kodad" }).expect(200);
      expect(upd.body).toMatchObject({ town: "Kodad", certifications: ["FSSAI Licensed"] }); // untouched fields stay

      await as("staff").post(`/admin/mills/${m.id}/deactivate`).expect(403);
      expect((await as("admin").post(`/admin/mills/${m.id}/deactivate`).expect(201)).body.isActive).toBe(false);
      expect((await as("admin").get(`/admin/mills?search=${TAG}`).expect(200)).body.total).toBe(0);
      expect((await as("admin").get(`/admin/mills?search=${TAG}&status=inactive`).expect(200)).body.total).toBe(1);
      expect((await as("admin").post(`/admin/mills/${m.id}/reactivate`).expect(201)).body.isActive).toBe(true);

      const audit = await auditRows(m.id);
      expect(audit.map((a) => a.action)).toEqual(["CREATE", "UPDATE", "DEACTIVATE", "REACTIVATE"]);
      expect(audit[1].changes).toEqual({ town: { before: "Suryapet", after: "Kodad" } });
    });
  });

  describe("varieties", () => {
    it("ADMIN creates and renames a variety; the slug stays fixed; duplicates are refused", async () => {
      await as("staff").post("/admin/varieties", { categoryId: "rice", name: `Kolam ${TAG}` }).expect(403);
      const v: AdminVariety = (await as("admin").post("/admin/varieties", { categoryId: "rice", name: `Kolam ${TAG}` }).expect(201)).body;
      created.varieties.push(v.id);
      expect(v).toMatchObject({ categoryId: "rice", slug: `kolam-${TAG.toLowerCase()}`, isActive: true });

      await as("admin").post("/admin/varieties", { categoryId: "rice", name: `Kolam ${TAG}` }).expect(409);
      await as("admin").post("/admin/varieties", { categoryId: "dal", name: "Toor" }).expect(400);

      const renamed = await as("admin").patch(`/admin/varieties/${v.id}`, { name: `Kolam Rice ${TAG}` }).expect(200);
      expect(renamed.body).toMatchObject({ name: `Kolam Rice ${TAG}`, slug: v.slug });
      expect((await as("staff").get(`/admin/varieties?search=${TAG}`).expect(200)).body.total).toBe(1);
      expect((await auditRows(v.id)).map((a) => a.action)).toEqual(["CREATE", "UPDATE"]);
    });
  });

  describe("batches and products", () => {
    let batch: AdminBatchDetail;

    it("ADMIN creates a batch with a pack: generated id, full stock, default best-before, audit rows", async () => {
      await as("staff").post("/admin/batches", riceBatch({ products: [pack] })).expect(403);

      batch = (await as("admin").post("/admin/batches", riceBatch({ products: [pack] })).expect(201)).body;
      created.batches.push(batch.id);
      // Kolam Rice: code "KR" from the variety's initials (renamed above; the id uses the current name).
      expect(batch.id).toMatch(/^KS-2026-0903-[A-Z0-9]{2}$/);
      expect(batch).toMatchObject({
        packedKg: 650,
        availableKg: 650,
        riceType: "RAW",
        age: "NEW",
        bestBefore: "2027-09-03", // packed + 365 days (rice shelf life)
        stockStatus: "in_stock",
        hasOrders: false,
        mill: { id: created.mills[0] },
      });
      expect(batch.products).toHaveLength(1);
      expect(batch.products[0]).toMatchObject({ bagSizeKg: 10, millPrice: 560, kisaMargin: 75, price: 635, packsAvailable: 65 });
      expect(batch.products[0].slug).toBe(`test-rice-${TAG.toLowerCase()}-10kg`);
      expect(batch.audit.map((a) => `${a.entity}:${a.action}`).sort()).toEqual(["Batch:CREATE", "Product:CREATE"]);

      // Same date and variety again: a different, still well-formed id; the slug gets a suffix.
      const again: AdminBatchDetail = (await as("admin").post("/admin/batches", riceBatch({ products: [pack], attributes: { riceType: "STEAM", age: "AGED" } })).expect(201)).body;
      created.batches.push(again.id);
      expect(again.id).not.toBe(batch.id);
      expect(again.id).toMatch(/^KS-2026-0903-[A-Z0-9]{2}$/);
      expect(again.products[0].slug).toBe(`test-rice-${TAG.toLowerCase()}-10kg-2`);
    });

    it("validates rice attributes, quality and dates", async () => {
      const res = await as("admin")
        .post("/admin/batches", riceBatch({ attributes: { riceType: "ROASTED", sizeGrade: "large" }, quality: { grade: "Z" } }))
        .expect(400);
      const paths = res.body.issues.map((i: { path: string }) => i.path);
      expect(paths).toEqual(expect.arrayContaining(["attributes.riceType", "attributes.age", "quality.moisturePct", "quality.grade"]));

      const dates = await as("admin").post("/admin/batches", riceBatch({ packedDate: "2026-08-01", bestBefore: "2026-07-01" })).expect(400);
      expect(dates.body.issues.map((i: { path: string }) => i.path)).toEqual(expect.arrayContaining(["packedDate", "bestBefore"]));
    });

    it("needs an active mill and variety", async () => {
      const res = await as("admin").post("/admin/batches", riceBatch({ millId: "no-such-mill", varietyId: "no-such-variety" })).expect(400);
      expect(res.body.issues.map((i: { path: string }) => i.path).sort()).toEqual(["millId", "varietyId"]);
    });

    it("price must equal mill price + Kisa margin, and the pack size must fit the category", async () => {
      const wrong = await as("admin").post(`/admin/batches/${batch.id}/products`, { ...pack, price: 700 }).expect(400);
      expect(wrong.body.issues[0]).toMatchObject({ path: "price" });
      expect(wrong.body.issues[0].message).toContain("₹635");
      const size = await as("admin").post(`/admin/batches/${batch.id}/products`, { ...pack, bagSizeKg: 3 }).expect(400);
      expect(size.body.issues[0]).toMatchObject({ path: "bagSizeKg" });

      const product = batch.products[0];
      await as("staff").patch(`/admin/products/${product.id}`, { price: 645, kisaMargin: 85 }).expect(403);
      await as("admin").patch(`/admin/products/${product.id}`, { price: 645 }).expect(400);
      const ok = await as("admin").patch(`/admin/products/${product.id}`, { price: 645, kisaMargin: 85 }).expect(200);
      expect(ok.body).toMatchObject({ price: 645, kisaMargin: 85, millPrice: 560 });
      expect((await as("admin").post(`/admin/products/${product.id}/deactivate`).expect(201)).body.isActive).toBe(false);
      expect((await as("admin").post(`/admin/products/${product.id}/reactivate`).expect(201)).body.isActive).toBe(true);
      expect((await auditRows(product.id)).map((a) => a.action)).toEqual(["CREATE", "UPDATE", "DEACTIVATE", "REACTIVATE"]);
    });

    it("lists with filters", async () => {
      const mine: Paginated<AdminBatchListItem> = (await as("staff").get(`/admin/batches?millId=${created.mills[0]}`).expect(200)).body;
      expect(mine.items.map((b) => b.id).sort()).toEqual([...created.batches].sort());
      const steam: Paginated<AdminBatchListItem> = (await as("staff").get(`/admin/batches?millId=${created.mills[0]}&riceType=STEAM&age=AGED`).expect(200)).body;
      expect(steam.total).toBe(1);
      const byVariety: Paginated<AdminBatchListItem> = (await as("staff").get(`/admin/batches?varietyId=${created.varieties[0]}`).expect(200)).body;
      expect(byVariety.total).toBe(2);
      const soldOut: Paginated<AdminBatchListItem> = (await as("staff").get("/admin/batches?stock=sold_out&pageSize=100").expect(200)).body;
      expect(soldOut.items.map((b) => b.id)).toContain("KS-2026-0610-HM");
    });
  });

  describe("stock adjustments", () => {
    it("STAFF can adjust; stock never goes below 0 or above packed kg; history and audit recorded", async () => {
      const id = created.batches[0];
      await as("staff").post(`/admin/batches/${id}/stock`, { deltaKg: 1, reason: "RETURNED" }).expect(409); // already full
      await as("staff").post(`/admin/batches/${id}/stock`, { deltaKg: -651, reason: "DAMAGED" }).expect(409);
      await as("staff").post(`/admin/batches/${id}/stock`, { deltaKg: -5, reason: "OTHER" }).expect(400); // OTHER needs a note

      const res = await as("staff").post(`/admin/batches/${id}/stock`, { deltaKg: -5, reason: "DAMAGED", note: "Torn bags" }).expect(201);
      expect(res.body.availableKg).toBe(645);
      expect(res.body.adjustment).toMatchObject({ deltaKg: -5, reason: "DAMAGED", availableBefore: 650, availableAfter: 645 });

      // Two removals at once that together exceed the stock: exactly one succeeds.
      const [a, b] = await Promise.all([
        as("admin").post(`/admin/batches/${id}/stock`, { deltaKg: -400, reason: "RECOUNT" }),
        as("admin").post(`/admin/batches/${id}/stock`, { deltaKg: -400, reason: "RECOUNT" }),
      ]);
      expect([a.status, b.status].sort()).toEqual([201, 409]);
      const detail: AdminBatchDetail = (await as("staff").get(`/admin/batches/${id}`).expect(200)).body;
      expect(detail.availableKg).toBe(245);
      expect(detail.stockAdjustments.map((s) => s.deltaKg)).toEqual([-400, -5]);
      expect(detail.audit.filter((x) => x.action === "STOCK_ADJUST")).toHaveLength(2);
    });
  });

  describe("locked fields after orders", () => {
    it("variety, mill, packed kg and rice type/age can't change once a batch has orders; other fields can", async () => {
      const id = created.batches[1];
      const product = await prisma.product.findFirstOrThrow({ where: { batchId: id } });
      // A minimal order through this batch (orders come in a later step).
      const customer = await prisma.customer.create({ data: { phone: `9${Date.now()}`.slice(0, 10), name: "E2E Customer" } });
      created.customers.push(customer.id);
      const order = await prisma.order.create({
        data: {
          code: `KS-ORD-E2E-${run}`,
          customerId: customer.id,
          addressName: "E2E",
          addressPhone: customer.phone,
          addressLine1: "1 Test Street",
          city: "Hyderabad",
          state: "Telangana",
          pincode: "500032",
          deliveryDate: new Date("2026-10-20T00:00:00Z"),
          deliverySlotId: "slot-morning",
          paymentMethod: "test",
          millTotalPaise: product.millPricePaise,
          kisaMarginTotalPaise: product.kisaMarginPaise,
          totalPaise: product.pricePaise,
          items: {
            create: {
              productId: product.id,
              batchId: id,
              millId: created.mills[0],
              productName: product.name,
              bagSizeKg: product.bagSizeKg,
              quantity: 1,
              unitPricePaise: product.pricePaise,
              millPricePaise: product.millPricePaise,
              kisaMarginPaise: product.kisaMarginPaise,
            },
          },
        },
      });
      created.orders.push(order.id);

      const detail: AdminBatchDetail = (await as("admin").get(`/admin/batches/${id}`).expect(200)).body;
      expect(detail.hasOrders).toBe(true);
      expect(detail.lockedFields).toEqual(["varietyId", "millId", "packedKg", "attributes"]);

      const locked = await as("admin").patch(`/admin/batches/${id}`, { packedKg: 600, millId: "mill-kakatiya", attributes: { riceType: "RAW", age: "AGED" } }).expect(409);
      expect(locked.body.message).toContain("packedKg");
      expect(locked.body.message).toContain("millId");
      expect(locked.body.message).toContain("attributes");
      const ok = await as("admin").patch(`/admin/batches/${id}`, { millingDate: "2026-08-30" }).expect(200);
      expect(ok.body.millingDate).toBe("2026-08-30");
      const audit = await auditRows(id);
      expect(audit[audit.length - 1]).toMatchObject({ action: "UPDATE", changes: { millingDate: { before: "2026-09-01", after: "2026-08-30" } } });
    });

    it("packed kg can change before orders, moving stock by the same amount", async () => {
      const id = created.batches[0]; // 245 kg available of 650 after the adjustments above
      const res = await as("admin").patch(`/admin/batches/${id}`, { packedKg: 600 }).expect(200);
      expect(res.body).toMatchObject({ packedKg: 600, availableKg: 195 });
      await as("admin").patch(`/admin/batches/${id}`, { packedKg: 300 }).expect(409); // below the 405 kg already gone
      await as("staff").patch(`/admin/batches/${id}`, { packedKg: 610 }).expect(403);
    });
  });
});
