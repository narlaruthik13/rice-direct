// End-to-end tests against the real app setup (helmet, CORS, filter, throttling) and
// the database in apps/api/.env. They create their own admin and an expired onion
// batch with unique ids, and delete them afterwards; seeded data is only read.
import "../src/config/load-env"; // first, as in main.ts
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { Test } from "@nestjs/testing";
import bcrypt from "bcryptjs";
import request from "supertest";
import type { AdminLoginResponse, AuthTokens, Product, ProductListResponse, TraceResponse } from "@kisa/shared";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/app.setup";
import { PrismaService } from "../src/prisma/prisma.service";

const seed = JSON.parse(readFileSync(join(__dirname, "../../../packages/db/prisma/seed-data.json"), "utf8"));

const run = randomUUID().slice(0, 8);
const ADMIN = { email: `e2e-${run}@kisa.test`, password: `Pw-${randomUUID()}`, name: "E2E Admin" };
const EXPIRED = { batchId: `KS-E2E-${run.toUpperCase()}`, slug: `e2e-expired-onions-${run}` };
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);

describe("Kisa API (e2e)", () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let adminId: string;
  const api = () => request(app.getHttpServer());

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);

    const admin = await prisma.adminUser.create({
      data: { email: ADMIN.email, name: ADMIN.name, role: "STAFF", passwordHash: await bcrypt.hash(ADMIN.password, 10) },
    });
    adminId = admin.id;

    // An onion batch packed 40 days ago with a 30-day shelf life: in stock, but expired.
    await prisma.batch.create({
      data: {
        id: EXPIRED.batchId,
        categoryId: "onions",
        salesModel: "FARMER_OWNED",
        farmerId: "farmer-shankar",
        partnerId: "packhouse-lasalgaon",
        variety: "Nashik Red",
        harvestDate: daysAgo(60),
        packedDate: daysAgo(40),
        inputKg: 100,
        outputKg: 90,
        availableKg: 90,
        shelfLifeDays: 30,
        expiresOn: daysAgo(10),
        attributes: { curingDays: 10, gradingDate: daysAgo(45).toISOString().slice(0, 10), sizeGrade: "medium" },
        quality: { grade: "A" },
        products: {
          create: {
            slug: EXPIRED.slug,
            name: "E2E expired onions",
            bagSizeKg: 5,
            farmerSharePaise: 10000,
            partnerSharePaise: 1500,
            platformFeePaise: 1000,
            pricePaise: 12500,
            description: "Test only",
            tags: [],
          },
        },
      },
    });
  });

  afterAll(async () => {
    await prisma.product.deleteMany({ where: { slug: EXPIRED.slug } });
    await prisma.batch.deleteMany({ where: { id: EXPIRED.batchId } });
    await prisma.adminUser.deleteMany({ where: { id: adminId } }); // sessions cascade
    await app.close();
  });

  describe("health", () => {
    it("reports the database as up, with a request id and security headers", async () => {
      const res = await api().get("/api/v1/health").expect(200);
      expect(res.body).toMatchObject({ status: "ok", database: "up" });
      expect(res.headers["x-request-id"]).toBeTruthy();
      expect(res.headers["x-powered-by"]).toBeUndefined();
      expect(res.headers["x-content-type-options"]).toBe("nosniff");
    });
  });

  // Login is limited to 5 attempts per minute per IP; this block uses exactly 5, then checks the 6th.
  describe("admin auth", () => {
    let session: AdminLoginResponse;

    it("rejects a wrong password and an unknown email with the same message", async () => {
      const wrongPassword = await api().post("/api/v1/auth/admin/login").send({ email: ADMIN.email, password: "nope" }).expect(401);
      const unknownEmail = await api()
        .post("/api/v1/auth/admin/login")
        .send({ email: `nobody-${run}@kisa.test`, password: ADMIN.password })
        .expect(401);
      expect(wrongPassword.body.message).toBe("Invalid email or password");
      expect(unknownEmail.body.message).toBe(wrongPassword.body.message);
      expect(JSON.stringify(wrongPassword.body)).not.toMatch(/stack|prisma/i);
    });

    it("validates the login body", async () => {
      const res = await api().post("/api/v1/auth/admin/login").send({ email: "not-an-email" }).expect(400);
      expect(res.body.message).toBe("Validation failed");
      expect(res.body.issues.map((i: { path: string }) => i.path).sort()).toEqual(["email", "password"]);
    });

    it("logs in, returns both tokens and the profile without the hash, and records lastLoginAt", async () => {
      const res = await api()
        .post("/api/v1/auth/admin/login")
        .send({ email: ADMIN.email.toUpperCase(), password: ADMIN.password }) // email is case-insensitive
        .expect(200);
      session = res.body;
      expect(session).toMatchObject({ tokenType: "Bearer", expiresIn: 900, refreshExpiresIn: 604800 });
      expect(session.accessToken).toBeTruthy();
      expect(session.refreshToken).toBeTruthy();
      expect(session.admin).toMatchObject({ id: adminId, email: ADMIN.email, role: "STAFF" });
      expect(session.admin).not.toHaveProperty("passwordHash");

      const db = await prisma.adminUser.findUniqueOrThrow({ where: { id: adminId } });
      expect(db.lastLoginAt).not.toBeNull();
      const sessions = await prisma.adminSession.findMany({ where: { adminUserId: adminId } });
      expect(sessions).toHaveLength(1);
      expect(sessions[0].refreshTokenHash).not.toBe(session.refreshToken); // stored hashed
    });

    it("GET /admin/me needs a valid access token", async () => {
      await api().get("/api/v1/admin/me").expect(401);
      await api().get("/api/v1/admin/me").set("Authorization", "Bearer not-a-token").expect(401);
      // A refresh token is not an access token.
      await api().get("/api/v1/admin/me").set("Authorization", `Bearer ${session.refreshToken}`).expect(401);

      const res = await api().get("/api/v1/admin/me").set("Authorization", `Bearer ${session.accessToken}`).expect(200);
      expect(res.body).toMatchObject({ id: adminId, email: ADMIN.email, name: ADMIN.name, role: "STAFF" });
      expect(res.body).not.toHaveProperty("passwordHash");
    });

    it("rotates the refresh token, and reusing an old one ends all sessions", async () => {
      const first = session.refreshToken;
      const res = await api().post("/api/v1/auth/admin/refresh").send({ refreshToken: first }).expect(200);
      const rotated: AuthTokens = res.body;
      expect(rotated.refreshToken).not.toBe(first);
      expect(rotated.accessToken).toBeTruthy();

      const sessions = await prisma.adminSession.findMany({ where: { adminUserId: adminId }, orderBy: { createdAt: "asc" } });
      expect(sessions).toHaveLength(2);
      expect(sessions[0].revokedAt).not.toBeNull();
      expect(sessions[0].replacedById).toBe(sessions[1].id);
      expect(sessions[1].revokedAt).toBeNull();

      // The new access token works.
      await api().get("/api/v1/admin/me").set("Authorization", `Bearer ${rotated.accessToken}`).expect(200);

      // Reusing the rotated token is treated as theft: it fails, and so does the newer one.
      await api().post("/api/v1/auth/admin/refresh").send({ refreshToken: first }).expect(401);
      await api().post("/api/v1/auth/admin/refresh").send({ refreshToken: rotated.refreshToken }).expect(401);
      const active = await prisma.adminSession.count({ where: { adminUserId: adminId, revokedAt: null } });
      expect(active).toBe(0);
    });

    it("logout revokes the session so its refresh token stops working", async () => {
      const login = await api().post("/api/v1/auth/admin/login").send(ADMIN).expect(200);
      const { refreshToken } = login.body as AdminLoginResponse;

      await api().post("/api/v1/auth/admin/logout").send({ refreshToken }).expect(204);
      await api().post("/api/v1/auth/admin/refresh").send({ refreshToken }).expect(401);
      // Logging out again is harmless.
      await api().post("/api/v1/auth/admin/logout").send({ refreshToken }).expect(204);
    });

    it("rate-limits login after 5 attempts per minute", async () => {
      const res = await api().post("/api/v1/auth/admin/login").send(ADMIN).expect(429);
      expect(res.body.statusCode).toBe(429);
    });
  });

  describe("catalogue", () => {
    it("lists products without expired onion batches, onions oldest batch first", async () => {
      const res = await api().get("/api/v1/products").expect(200);
      const body: ProductListResponse = res.body;
      const slugs = body.products.map((p) => p.id);
      expect(slugs).not.toContain(EXPIRED.slug);
      expect(slugs.length).toBeGreaterThanOrEqual(seed.products.length);

      const onions = body.products.filter((p) => p.categoryId === "onions");
      const batches = await prisma.batch.findMany({ where: { id: { in: onions.map((p) => p.batchId) } } });
      const packed = new Map(batches.map((b) => [b.id, b.packedDate.getTime()]));
      const order = onions.map((p) => packed.get(p.batchId)!);
      expect(order).toEqual([...order].sort((a, b) => a - b));

      // Every referenced farmer and partner is included.
      const farmerIds = new Set(body.farmers.map((f) => f.id));
      const partnerIds = new Set(body.partners.map((p) => p.id));
      expect(body.products.every((p) => farmerIds.has(p.farmerId) && partnerIds.has(p.partnerId))).toBe(true);
    });

    it("hides the expired product page, but its trace page still works", async () => {
      await api().get(`/api/v1/products/${EXPIRED.slug}`).expect(404);
      const trace = await api().get(`/api/v1/trace/${EXPIRED.batchId}`).expect(200);
      expect(trace.body.batch.id).toBe(EXPIRED.batchId);
    });

    it("filters by category, sales model and stock", async () => {
      const onions: ProductListResponse = (await api().get("/api/v1/products?category=onions&salesModel=PARTNER_SOURCED").expect(200)).body;
      expect(onions.products.length).toBeGreaterThan(0);
      expect(onions.products.every((p) => p.categoryId === "onions" && p.salesModel === "PARTNER_SOURCED")).toBe(true);

      const inStock: ProductListResponse = (await api().get("/api/v1/products?inStock=true").expect(200)).body;
      expect(inStock.products.every((p) => p.inStock)).toBe(true);
      const soldOut: ProductListResponse = (await api().get("/api/v1/products?inStock=false").expect(200)).body;
      expect(soldOut.products.every((p) => !p.inStock)).toBe(true);
    });

    it("returns the website's shapes: seeded products and batches equal the mock data", async () => {
      const body: ProductListResponse = (await api().get("/api/v1/products").expect(200)).body;
      const bySlug = new Map(body.products.map((p) => [p.id, p]));
      for (const mock of seed.products as Product[]) expect(bySlug.get(mock.id)).toEqual(mock);

      const mockBatch = seed.batches.find((b: { id: string }) => b.id === "KS-2026-1005-NR");
      const trace: TraceResponse = (await api().get("/api/v1/trace/KS-2026-1005-NR").expect(200)).body;
      expect(trace.batch).toEqual(mockBatch);
      expect(trace.farmer).toEqual(seed.farmers.find((f: { id: string }) => f.id === mockBatch.farmerId));
      expect(trace.partner).toEqual(seed.partners.find((p: { id: string }) => p.id === mockBatch.partnerId));

      const detail = (await api().get("/api/v1/products/aged-sona-masoori-10kg").expect(200)).body;
      expect(detail.product.price).toBe(690); // 62 + 4 + 3 per kg, 10 kg
      expect(detail.farmer.method).toBe("low-chemical");
    });

    it("lists categories with rupee fees", async () => {
      const res = await api().get("/api/v1/categories").expect(200);
      expect(res.body.map((c: { id: string }) => c.id)).toEqual(["rice", "onions"]);
      expect(res.body[0]).toMatchObject({ partnerType: "MILL", platformFeePerKg: 3, packSizesKg: [5, 10, 25] });
    });

    it("rejects bad queries and unknown ids without leaking internals", async () => {
      const bad = await api().get("/api/v1/products?inStock=maybe").expect(400);
      expect(bad.body.issues[0].path).toBe("inStock");
      await api().get("/api/v1/products?sort=price").expect(400); // unknown parameter

      const missing = await api().get("/api/v1/products/no-such-product").expect(404);
      expect(missing.body).toEqual({
        statusCode: 404,
        error: "Not Found",
        message: "Product not found",
        requestId: expect.any(String),
      });
      await api().get("/api/v1/trace/KS-0000-NOPE").expect(404);
    });
  });
});
