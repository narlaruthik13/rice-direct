// Creates a throwaway STAFF admin for this run; its email and password reach the
// tests through environment variables. Removed again in global-teardown.ts.
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma, TEST_ADMIN_NAME } from "./db";

export default async function globalSetup() {
  const run = randomUUID().slice(0, 8);
  const email = `playwright-${run}@kisa.test`;
  const password = `Pw-${randomUUID()}`;
  await prisma.adminUser.create({
    data: { email, name: TEST_ADMIN_NAME, role: "STAFF", passwordHash: await bcrypt.hash(password, 10) },
  });
  await prisma.$disconnect();
  process.env.E2E_ADMIN_EMAIL = email;
  process.env.E2E_ADMIN_PASSWORD = password;
}
