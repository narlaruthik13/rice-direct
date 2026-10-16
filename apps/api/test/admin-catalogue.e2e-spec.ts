// Admin management of farmers, partners, batches, products and stock (step 5).
// Creates its own ADMIN and STAFF users and test records (unique per run), and
// removes everything it created afterwards. Seeded data is only read.
import "../src/config/load-env"; // first, as in main.ts
import { randomUUID } from "node:crypto";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { Test } from "@nestjs/testing";
import bcrypt from "bcryptjs";
import request from "supertest";
import type { AdminBatchDetail, AdminFarmer, AdminPartner, BatchCreateInput, Paginated, AdminBatchListItem } from "@kisa/shared";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/app.setup";
import { PrismaService } from "../src/prisma/prisma.service";

const run = randomUUID().slice(0, 6);
const TAG = `E2E${run}`; // in names, so searches find only this run's records
const users = {
  admin: { email: `e2e-admin-${run}@kisa.test`, password: `Pw-${randomUUID()}`, role: "ADMIN" as const },
  staff: { email: `e2e-staff-${run}@kisa.test`, password: `Pw-${randomUUID()}`, role: "STAFF" as const },
};

const farmerBody = {
  name: `Ravi ${TAG}`,
  phone: "9876543210",
  village: "Kollapur",
  district: "Nagarkurnool",
  state: "Telangana",
  acres: 3.5,
  yearsFarming: 11,
  method: "natural" as const,
  story: "Grows paddy with natural farming on the Krishna backwaters.",
};

const riceQuality = { moisturePct: 12.8, brokenPct: 2.2, foreignMatterPct: 0.1, grainLengthMm: 5.1, testedBy: "Mill lab", testedOn: "2026-09-02", grade: "A" };
const riceProduct = { name: `Sona ${TAG}`, bagSizeKg: 10, farmerShare: 600, partnerShare: 40, price: 670, description: "Test pack of new-crop Sona Masoori." };

describe("Admin catalogue (e2e)", () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  const token: Record<keyof typeof users, string> = { admin: "", staff: "" };
  const adminIds: string[] = [];
  const created = { farmers: [] as string[], partners: [] as string[], batches: [] as string[], orders: [] as string[], customers: [] as string[] };

  const api = () => request(app.getHttpServer());
  const as = (who: keyof typeof users) => ({
    get: (url: string) => api().get(`/api/v1${url}`).set("Authorization", `Bearer ${token[who]}`),
    post: (url: string, body?: object) => api().post(`/api/v1${url}`).set("Authorization", `Bearer ${token[who]}`).send(body ?? {}),
    patch: (url: string, body: object) => api().patch(`/api/v1${url}`).set("Authorization", `Bearer ${token[who]}`).send(body),
  });
  const auditRows = (entityId: string) => prisma.adminAuditLog.findMany({ where: { entityId }, orderBy: { createdAt: "asc" } });

  const riceBatch = (overrides: Partial<BatchCreateInput> = {}): BatchCreateInput => ({
    categoryId: "rice",
    salesModel: "FARMER_OWNED",
    farmerId: created.farmers[0],
    partnerId: "mill-godavari",
    variety: "Sona Masoori",
    harvestDate: "2026-05-01",
    packedDate: "2026-09-03",
    inputKg: 1000,
    outputKg: 650,
    attributes: { millingDate: "2026-09-01", age: "new" },
    quality: riceQuality,
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
    await prisma.farmer.deleteMany({ where: { id: { in: created.farmers } } });
    await prisma.partner.deleteMany({ where: { id: { in: created.partners } } });
    await prisma.adminUser.deleteMany({ where: { id: { in: adminIds } } });
    await app.close();
  });

  describe("farmers", () => {
    it("STAFF can view but not create", async () => {
      await as("staff").get("/admin/farmers").expect(200);
      await as("staff").post("/admin/farmers", farmerBody).expect(403);
    });

    it("validates the farmer form", async () => {
      const res = await as("admin").post("/admin/farmers", { ...farmerBody, phone: "12345", acres: 0 }).expect(400);
      expect(res.body.issues.map((i: { path: string }) => i.path).sort()).toEqual(["acres", "phone"]);
    });

    it("ADMIN creates, reads, searches and updates a farmer, with audit rows", async () => {
      const res = await as("admin").post("/admin/farmers", farmerBody).expect(201);
      const f: AdminFarmer = res.body;
      created.farmers.push(f.id);
      expect(f).toMatchObject({ name: farmerBody.name, method: "natural", isActive: true, batchCount: 0, phone: "9876543210" });

      expect((await as("staff").get(`/admin/farmers/${f.id}`).expect(200)).body.id).toBe(f.id);
      const list: Paginated<AdminFarmer> = (await as("admin").get(`/admin/farmers?search=${TAG}`).expect(200)).body;
      expect(list.total).toBe(1);
      expect(list.items[0].id).toBe(f.id);

      const upd = await as("admin").patch(`/admin/farmers/${f.id}`, { village: "Pebbair", method: "low-chemical" }).expect(200);
      expect(upd.body).toMatchObject({ village: "Pebbair", method: "low-chemical" });

      const audit = await auditRows(f.id);
      expect(audit.map((a) => a.action)).toEqual(["CREATE", "UPDATE"]);
      expect(audit[1].changes).toEqual({
        village: { before: "Kollapur", after: "Pebbair" },
        method: { before: "natural", after: "low-chemical" },
      });
    });

    it("deactivates and reactivates (soft only); STAFF can't", async () => {
      const id = created.farmers[0];
      await as("staff").post(`/admin/farmers/${id}/deactivate`).expect(403);
      expect((await as("admin").post(`/admin/farmers/${id}/deactivate`).expect(201)).body.isActive).toBe(false);
      expect((await as("admin").get(`/admin/farmers?search=${TAG}`).expect(200)).body.total).toBe(0);
      expect((await as("admin").get(`/admin/farmers?search=${TAG}&status=inactive`).expect(200)).body.total).toBe(1);
      expect((await as("admin").post(`/admin/farmers/${id}/reactivate`).expect(201)).body.isActive).toBe(true);
      expect((await auditRows(id)).map((a) => a.action)).toEqual(["CREATE", "UPDATE", "DEACTIVATE", "REACTIVATE"]);
      expect(await prisma.farmer.count({ where: { id } })).toBe(1); // never hard-deleted
    });
  });

  describe("partners", () => {
    it("ADMIN creates and updates a packhouse with a fee in rupees; STAFF can't edit", async () => {
      const body = { type: "PACKHOUSE", name: `Packhouse ${TAG}`, town: "Kurnool", district: "Kurnool", state: "Andhra Pradesh", processingFeePerKg: 2.5, certifications: ["FSSAI Licensed"], established: 2019 };
      await as("staff").post("/admin/partners", body).expect(403);
      const p: AdminPartner = (await as("admin").post("/admin/partners", body).expect(201)).body;
      created.partners.push(p.id);
      expect(p).toMatchObject({ type: "PACKHOUSE", processingFeePerKg: 2.5, isActive: true });

      await as("staff").patch(`/admin/partners/${p.id}`, { processingFeePerKg: 3 }).expect(403);
      expect((await as("admin").patch(`/admin/partners/${p.id}`, { processingFeePerKg: 3.25 }).expect(200)).body.processingFeePerKg).toBe(3.25);
      expect((await as("admin").get(`/admin/partners?type=PACKHOUSE&search=${TAG}`).expect(200)).body.total).toBe(1);

      await as("admin").post(`/admin/partners/${p.id}/deactivate`).expect(201);
      const audit = await auditRows(p.id);
      expect(audit.map((a) => a.action)).toEqual(["CREATE", "UPDATE", "DEACTIVATE"]);
      expect(audit[1].changes).toEqual({ processingFeePerKg: { before: 2.5, after: 3.25 } });
    });

    it("a rice batch can't use a packhouse", async () => {
      const res = await as("admin").post("/admin/batches", riceBatch({ partnerId: "packhouse-lasalgaon" })).expect(400);
      expect(res.body.issues[0]).toMatchObject({ path: "partnerId" });
    });
  });

  describe("batches and products", () => {
    let batch: AdminBatchDetail;

    it("ADMIN creates a batch with a product: generated id, full stock, default platform fee, audit rows", async () => {
      await as("staff").post("/admin/batches", riceBatch({ products: [riceProduct] })).expect(403);

      const res = await as("admin").post("/admin/batches", riceBatch({ products: [riceProduct] })).expect(201);
      batch = res.body;
      created.batches.push(batch.id);
      expect(batch.id).toMatch(/^KS-2026-0903-[A-Z0-9]{2}$/);
      expect(batch).toMatchObject({ availableKg: 650, outputKg: 650, salesModel: "FARMER_OWNED", stockStatus: "in_stock", hasOrders: false });
      expect(batch.products).toHaveLength(1);
      // Rice platform fee is ₹3/kg, so a 10 kg pack defaults to ₹30; 600 + 40 + 30 = 670.
      expect(batch.products[0]).toMatchObject({ bagSizeKg: 10, farmerShare: 600, partnerShare: 40, platformFee: 30, price: 670, packsAvailable: 65 });
      expect(batch.products[0].slug).toBe(`sona-${TAG.toLowerCase()}-10kg`);
      expect(batch.audit.map((a) => `${a.entity}:${a.action}`).sort()).toEqual(["Batch:CREATE", "Product:CREATE"]);

      // Same date and variety again: a different, still well-formed id; the slug gets a suffix.
      const again: AdminBatchDetail = (await as("admin").post("/admin/batches", riceBatch({ products: [riceProduct] })).expect(201)).body;
      created.batches.push(again.id);
      expect(again.id).not.toBe(batch.id);
      expect(again.id).toMatch(/^KS-2026-0903-[A-Z0-9]{2}$/);
      expect(again.products[0].slug).toBe(`sona-${TAG.toLowerCase()}-10kg-2`);
    });

    it("enforces the Model A / Model B purchase rule", async () => {
      const a = await as("admin").post("/admin/batches", riceBatch({ salesModel: "PARTNER_SOURCED" })).expect(400);
      expect(a.body.issues.map((i: { path: string }) => i.path)).toContain("purchase");
      const b = await as("admin").post("/admin/batches", riceBatch({ purchase: { date: "2026-05-03", pricePerKg: 34 } })).expect(400);
      expect(b.body.issues.map((i: { path: string }) => i.path)).toContain("purchase");

      const ok: AdminBatchDetail = (
        await as("admin").post("/admin/batches", riceBatch({ salesModel: "PARTNER_SOURCED", purchase: { date: "2026-05-03", pricePerKg: 34.5 } })).expect(201)
      ).body;
      created.batches.push(ok.id);
      expect(ok.purchase).toEqual({ date: "2026-05-03", pricePerKg: 34.5 });
    });

    it("validates crop-specific attributes and quality", async () => {
      const res = await as("admin")
        .post("/admin/batches", riceBatch({ attributes: { curingDays: 10, gradingDate: "2026-09-01", sizeGrade: "large" }, quality: { grade: "Z" } }))
        .expect(400);
      const paths = res.body.issues.map((i: { path: string }) => i.path);
      expect(paths).toEqual(expect.arrayContaining(["attributes.millingDate", "attributes.age", "quality.moisturePct", "quality.grade"]));

      const onion = await as("admin")
        .post("/admin/batches", riceBatch({ categoryId: "onions", variety: "Bellary", partnerId: "packhouse-kurnool", attributes: { millingDate: "2026-09-01", age: "new" } }))
        .expect(400);
      expect(onion.body.issues.map((i: { path: string }) => i.path)).toEqual(expect.arrayContaining(["shelfLifeDays", "attributes.sizeGrade"]));
    });

    it("price must equal the sum of the parts, and the pack size must fit the category", async () => {
      const wrong = await as("admin").post(`/admin/batches/${batch.id}/products`, { ...riceProduct, price: 700 }).expect(400);
      expect(wrong.body.issues[0]).toMatchObject({ path: "price" });
      expect(wrong.body.issues[0].message).toContain("₹670");
      const size = await as("admin").post(`/admin/batches/${batch.id}/products`, { ...riceProduct, bagSizeKg: 3 }).expect(400);
      expect(size.body.issues[0]).toMatchObject({ path: "bagSizeKg" });

      const product = batch.products[0];
      await as("staff").patch(`/admin/products/${product.id}`, { price: 680, farmerShare: 610 }).expect(403);
      await as("admin").patch(`/admin/products/${product.id}`, { price: 680 }).expect(400);
      const ok = await as("admin").patch(`/admin/products/${product.id}`, { price: 680, farmerShare: 610 }).expect(200);
      expect(ok.body).toMatchObject({ price: 680, farmerShare: 610 });
      expect((await as("admin").post(`/admin/products/${product.id}/deactivate`).expect(201)).body.isActive).toBe(false);
      expect((await as("admin").post(`/admin/products/${product.id}/reactivate`).expect(201)).body.isActive).toBe(true);
      expect((await auditRows(product.id)).map((a) => a.action)).toEqual(["CREATE", "UPDATE", "DEACTIVATE", "REACTIVATE"]);
    });

    it("lists with filters", async () => {
      const mine: Paginated<AdminBatchListItem> = (await as("staff").get(`/admin/batches?farmerId=${created.farmers[0]}&category=rice`).expect(200)).body;
      expect(mine.items.map((b) => b.id).sort()).toEqual([...created.batches].sort());
      const modelA: Paginated<AdminBatchListItem> = (await as("staff").get(`/admin/batches?farmerId=${created.farmers[0]}&salesModel=PARTNER_SOURCED`).expect(200)).body;
      expect(modelA.total).toBe(1);
      const soldOut: Paginated<AdminBatchListItem> = (await as("staff").get("/admin/batches?stock=sold_out&pageSize=100").expect(200)).body;
      expect(soldOut.items.every((b) => b.stockStatus === "sold_out")).toBe(true);
    });
  });

  describe("stock adjustments", () => {
    it("STAFF can adjust; stock never goes below 0 or above output; history and audit recorded", async () => {
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
    it("salesModel, farmer, partner and outputKg can't change once a batch has orders; other fields can", async () => {
      const id = created.batches[1];
      const product = await prisma.product.findFirstOrThrow({ where: { batchId: id } });
      // A minimal order through this batch (orders come in step 6).
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
          farmerTotalPaise: product.farmerSharePaise,
          partnerTotalPaise: product.partnerSharePaise,
          platformTotalPaise: product.platformFeePaise,
          totalPaise: product.pricePaise,
          items: {
            create: {
              productId: product.id,
              batchId: id,
              productName: product.name,
              bagSizeKg: product.bagSizeKg,
              quantity: 1,
              salesModel: "FARMER_OWNED",
              farmerId: created.farmers[0],
              partnerId: "mill-godavari",
              unitPricePaise: product.pricePaise,
              farmerSharePaise: product.farmerSharePaise,
              partnerSharePaise: product.partnerSharePaise,
              platformFeePaise: product.platformFeePaise,
            },
          },
        },
      });
      created.orders.push(order.id);

      const detail: AdminBatchDetail = (await as("admin").get(`/admin/batches/${id}`).expect(200)).body;
      expect(detail.hasOrders).toBe(true);
      expect(detail.lockedFields).toEqual(["salesModel", "farmerId", "partnerId", "outputKg"]);

      const locked = await as("admin").patch(`/admin/batches/${id}`, { outputKg: 600, partnerId: "mill-kakatiya" }).expect(409);
      expect(locked.body.message).toContain("outputKg");
      expect(locked.body.message).toContain("partnerId");
      const ok = await as("admin").patch(`/admin/batches/${id}`, { harvestDate: "2026-04-28" }).expect(200);
      expect(ok.body.harvestDate).toBe("2026-04-28");
      const audit = await auditRows(id);
      expect(audit[audit.length - 1]).toMatchObject({ action: "UPDATE", changes: { harvestDate: { before: "2026-05-01", after: "2026-04-28" } } });
    });

    it("output can change before orders, moving stock by the same amount", async () => {
      const id = created.batches[2]; // the Model A batch, no orders
      const res = await as("admin").patch(`/admin/batches/${id}`, { outputKg: 600 }).expect(200);
      expect(res.body).toMatchObject({ outputKg: 600, availableKg: 600 });
      await as("admin").patch(`/admin/batches/${id}`, { outputKg: 2000 }).expect(400); // more than input
      await as("staff").patch(`/admin/batches/${id}`, { outputKg: 610 }).expect(403);
    });
  });
});
