// Database access for the website tests: the same database the test API uses (apps/api/.env).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseEnv } from "node:util";
import { PrismaClient } from "@kisa/db";

const apiEnv = parseEnv(readFileSync(join(__dirname, "..", "..", "api", ".env"), "utf8"));

export const prisma = new PrismaClient({ datasourceUrl: apiEnv.DATABASE_URL });

/** The pack whose price the revalidation test changes (restored in global-teardown.ts). */
export const PRICE_TEST = { slug: "sona-masoori-steam-new-10kg", batchId: "KS-2026-0915-SM" };

/** Not "playwright-…": the admin suite's teardown removes those, and the suites can run at the same time. */
export const ADMIN_EMAIL_PREFIX = "web-e2e-";
