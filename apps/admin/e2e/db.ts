// Database access for the admin tests: the same database the test API uses (apps/api/.env).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseEnv } from "node:util";
import { PrismaClient } from "@kisa/db";

const apiEnv = parseEnv(readFileSync(join(__dirname, "..", "..", "api", ".env"), "utf8"));

export const prisma = new PrismaClient({ datasourceUrl: apiEnv.DATABASE_URL });

export const TEST_ADMIN_NAME = "Playwright Admin";
