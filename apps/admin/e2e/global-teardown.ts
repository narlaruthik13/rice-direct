import { prisma } from "./db";

/** Deletes every admin created by the admin tests (their sessions cascade). */
export default async function globalTeardown() {
  await prisma.adminUser.deleteMany({ where: { email: { startsWith: "playwright-", endsWith: "@kisa.test" } } });
  await prisma.$disconnect();
}
