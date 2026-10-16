// End-to-end tests against the real app setup (helmet, CORS, filter, throttling) and
// the database in apps/api/.env (the Neon dev branch). They create their own admin and
// a few rice batches with unique ids, and delete them afterwards; seeded data is only read.
import "../src/config/load-env"; // first, as in main.ts
import { randomUUID } from "node:crypto";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { Test } from "@nestjs/testing";
import bcrypt from "bcryptjs";
import request from "supertest";
import type { AdminLoginResponse, AuthTokens, DashboardSummary, ProductDetailResponse, ProductListResponse, TraceResponse } from "@kisa/shared";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/app.setup";
import { PrismaService } from "../src/prisma/prisma.service";

const run = randomUUID().slice(0, 8);
const ADMIN = { email: `e2e-${run}@kisa.test`, password: `Pw-${randomUUID()}`, name: "E2E Admin" };
const EXPIRED = { batchId: `KS-E2E-${run.toUpperCase()}-OLD`, slug: `e2e-expired-${run}` };
const LOW = { batchId: `KS-E2E-${run.toUpperCase()}-LOW`, slug: `e2e-low-${run}` };
const SOON = { batchId: `KS-E2E-${run.toUpperCase()}-SOON`, slug: `e2e-soon-${run}` };
const FIXTURE_BATCHES = [EXPIRED.batchId, LOW.batchId, SOON.batchId];

/** A DATE value n days from today in India (negative = past). */
const todayPlus = (n: number) =>
  new Date(Date.parse(`${new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date())}T00:00:00.000Z`) + n * 86_400_000);
const quality = { moisturePct: 12.5, brokenPct: 2, foreignMatterPct: 0.1, grainLengthMm: 5, testedBy: "E2E lab", testedOn: "2026-09-01", grade: "A" };
const product = (slug: string, bagSizeKg: number) => ({
  slug,
  name: `E2E ${slug}`,
  bagSizeKg,
  millPricePaise: 5000 * bagSizeKg,
  kisaMarginPaise: 800 * bagSizeKg,
  pricePaise: 5800 * bagSizeKg,
  description: "Test only",
  tags: [],
});
const batch = (id: string, over: { availableKg?: number; bestBefore: Date; slug: string; bag: number }) => ({
  id,
  categoryId: "rice",
  varietyId: "variety-sona-masoori",
  millId: "mill-godavari",
  millingDate: todayPlus(-60),
  packedDate: todayPlus(-58),
  bestBefore: over.bestBefore,
  packedKg: 100,
  availableKg: over.availableKg ?? 100,
  attributes: { riceType: "RAW", age: "NEW" },
  quality,
  products: { create: product(over.slug, over.bag) },
});

/** Every key anywhere in a JSON value. */
const allKeys = (v: unknown): string[] =>
  Array.isArray(v) ? v.flatMap(allKeys) : v && typeof v === "object" ? Object.entries(v).flatMap(([k, x]) => [k, ...allKeys(x)]) : [];

describe("Kisa API (e2e)", () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let adminId: string;
  let accessToken: string; // from the successful login, reused by the dashboard tests
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

    // Past its best-before: in stock, but no longer sold. Its Quality Passport still works.
    await prisma.batch.create({ data: batch(EXPIRED.batchId, { bestBefore: todayPlus(-1), slug: EXPIRED.slug, bag: 5 }) });
    // One 10 kg pack left.
    await prisma.batch.create({ data: batch(LOW.batchId, { availableKg: 15, bestBefore: todayPlus(200), slug: LOW.slug, bag: 10 }) });
    // Best-before in 10 days.
    await prisma.batch.create({ data: batch(SOON.batchId, { availableKg: 50, bestBefore: todayPlus(10), slug: SOON.slug, bag: 5 }) });
  });

  afterAll(async () => {
    await prisma.product.deleteMany({ where: { batchId: { in: FIXTURE_BATCHES } } });
    await prisma.batch.deleteMany({ where: { id: { in: FIXTURE_BATCHES } } });
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
      accessToken = session.accessToken;
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
    it("lists categories and active varieties", async () => {
      const cats = (await api().get("/api/v1/categories").expect(200)).body;
      expect(cats).toEqual([{ id: "rice", name: "Rice", slug: "rice", packSizesKg: [5, 10, 25], shelfLifeDays: 365 }]);
      const varieties = (await api().get("/api/v1/varieties").expect(200)).body;
      expect(varieties.map((v: { name: string }) => v.name)).toEqual(["BPT 5204", "HMT", "Sona Masoori"]);
    });

    it("hides batches past their best-before date, but their Quality Passport still works", async () => {
      const body: ProductListResponse = (await api().get("/api/v1/products").expect(200)).body;
      const slugs = body.products.map((p) => p.id);
      expect(slugs).not.toContain(EXPIRED.slug);
      expect(slugs).toEqual(expect.arrayContaining([LOW.slug, SOON.slug, "sona-masoori-raw-new-10kg"]));
      await api().get(`/api/v1/products/${EXPIRED.slug}`).expect(404);

      const trace: TraceResponse = (await api().get(`/api/v1/trace/${EXPIRED.batchId}`).expect(200)).body;
      expect(trace.passport).toMatchObject({ batchId: EXPIRED.batchId, riceType: "RAW", age: "NEW", variety: { name: "Sona Masoori", slug: "sona-masoori" } });
    });

    it("filters by rice type, variety, age, pack size and stock", async () => {
      const get = async (q: string) => ((await api().get(`/api/v1/products?${q}`).expect(200)).body as ProductListResponse).products;

      const steam = await get("riceType=STEAM");
      expect(steam.length).toBeGreaterThan(0);
      expect(steam.every((p) => p.riceType === "STEAM")).toBe(true);

      const bpt = await get("variety=bpt-5204");
      expect(bpt.map((p) => p.id).sort()).toEqual(["bpt-5204-boiled-aged-10kg", "bpt-5204-raw-new-10kg", "bpt-5204-raw-new-25kg"]);

      const aged = await get("age=AGED");
      expect(aged.length).toBeGreaterThan(0);
      expect(aged.every((p) => p.age === "AGED")).toBe(true);

      const big = await get("packSize=25");
      expect(big.length).toBeGreaterThan(0);
      expect(big.every((p) => p.bagSizeKg === 25)).toBe(true);

      const rawAged = await get("riceType=RAW&age=AGED&variety=sona-masoori");
      expect(rawAged.map((p) => p.id).sort()).toEqual(["sona-masoori-raw-aged-10kg", "sona-masoori-raw-aged-25kg"]);

      const inStock = await get("inStock=true");
      expect(inStock.every((p) => p.inStock)).toBe(true);
      const soldOut = await get("inStock=false");
      expect(soldOut.map((p) => p.id)).toContain("hmt-steam-aged-10kg");
      expect(soldOut.every((p) => !p.inStock)).toBe(true);
    });

    it("shows one total price and the Quality Passport for a product", async () => {
      const d: ProductDetailResponse = (await api().get("/api/v1/products/sona-masoori-raw-new-10kg").expect(200)).body;
      expect(d.product).toMatchObject({
        id: "sona-masoori-raw-new-10kg",
        categoryId: "rice",
        variety: { name: "Sona Masoori", slug: "sona-masoori" },
        riceType: "RAW",
        age: "NEW",
        bagSizeKg: 10,
        price: 650, // mill price 570 + Kisa margin 80; only the total is public
        inStock: true,
        batchId: "KS-2026-0904-SM",
      });
      expect(d.passport).toEqual({
        batchId: "KS-2026-0904-SM",
        categoryId: "rice",
        variety: { name: "Sona Masoori", slug: "sona-masoori" },
        riceType: "RAW",
        age: "NEW",
        millingDate: "2026-09-02",
        packedDate: "2026-09-04",
        bestBefore: "2027-09-04", // packed + 365 days
        quality: { moisturePct: 13.1, brokenPct: 2.4, foreignMatterPct: 0.1, grainLengthMm: 5.1, testedBy: "Kisa QC lab, Hyderabad", testedOn: "2026-09-05", grade: "A+" },
      });
    });

    it("never exposes mills, farmers or the price split in any public response", async () => {
      const mills = await prisma.mill.findMany();
      const paths = [
        "/categories",
        "/varieties",
        "/products",
        "/products?inStock=false",
        "/products/sona-masoori-raw-new-10kg",
        "/products/bpt-5204-boiled-aged-10kg",
        "/trace/KS-2026-0904-SM",
        "/trace/KS-2026-0610-HM",
        `/trace/${EXPIRED.batchId}`,
      ];
      for (const path of paths) {
        const res = await api().get(`/api/v1${path}`).expect(200);
        // "millingDate" is a quality fact, not mill data; every other mill-ish key is forbidden.
        const forbiddenKeys = allKeys(res.body).filter((k) => /mill(?!ing)|farmer|margin|partner|cost|share|platform/i.test(k));
        expect({ path, forbiddenKeys }).toEqual({ path, forbiddenKeys: [] });
        const text = JSON.stringify(res.body);
        for (const m of mills) {
          expect(text).not.toContain(m.id);
          expect(text).not.toContain(m.name);
          if (m.contactName) expect(text).not.toContain(m.contactName);
        }
      }
    });

    it("rejects bad queries and unknown ids without leaking internals", async () => {
      const bad = await api().get("/api/v1/products?riceType=ROASTED").expect(400);
      expect(bad.body.issues[0].path).toBe("riceType");
      await api().get("/api/v1/products?farmer=ramana").expect(400); // unknown parameter
      await api().get("/api/v1/products?packSize=ten").expect(400);

      const missing = await api().get("/api/v1/products/no-such-product").expect(404);
      expect(missing.body).toEqual({ statusCode: 404, error: "Not Found", message: "Product not found", requestId: expect.any(String) });
      await api().get("/api/v1/trace/KS-0000-NOPE").expect(404);
    });
  });

  describe("admin dashboard", () => {
    it("needs a valid access token", async () => {
      await api().get("/api/v1/admin/dashboard/summary").expect(401);
    });

    it("returns stock counts, low-stock batches and batches near their best-before date", async () => {
      const res = await api().get("/api/v1/admin/dashboard/summary").set("Authorization", `Bearer ${accessToken}`).expect(200);
      const s: DashboardSummary = res.body;

      expect(s.today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(s.ordersToday).toBe(0);
      expect(s.products.active).toBe(s.products.inStock + s.products.soldOut);
      expect(s.soldOut.items.map((p) => p.slug)).toContain("hmt-steam-aged-10kg");

      const low = s.lowStock.items.find((b) => b.batchId === LOW.batchId);
      expect(low).toMatchObject({ variety: "Sona Masoori", availableKg: 15, packSizeKg: 10, packsLeft: 1 });
      expect(s.lowStock.items.every((b) => b.packsLeft === 1)).toBe(true);

      const soon = s.bestBeforeSoon.items.find((b) => b.batchId === SOON.batchId);
      expect(soon).toMatchObject({ variety: "Sona Masoori", daysLeft: 10, availableKg: 50 });
      expect(s.bestBeforeSoon.items.map((b) => b.batchId)).not.toContain(EXPIRED.batchId);
      expect(s.bestBeforeSoon.items.every((b) => b.daysLeft >= 1 && b.daysLeft <= 30)).toBe(true);
    });
  });
});
