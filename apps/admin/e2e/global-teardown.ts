import { prisma } from "./db";

/**
 * Removes everything the admin tests created: the test admins, the farmers named
 * "PW …" with their batches and packs, and the audit and stock rows the test admins wrote.
 */
export default async function globalTeardown() {
  const admins = await prisma.adminUser.findMany({ where: { email: { startsWith: "playwright-", endsWith: "@kisa.test" } }, select: { id: true } });
  const adminIds = admins.map((a) => a.id);
  const farmers = await prisma.farmer.findMany({ where: { name: { startsWith: "PW " } }, select: { id: true } });
  const batches = await prisma.batch.findMany({ where: { farmerId: { in: farmers.map((f) => f.id) } }, select: { id: true } });
  const batchIds = batches.map((b) => b.id);

  await prisma.stockAdjustment.deleteMany({ where: { OR: [{ adminUserId: { in: adminIds } }, { batchId: { in: batchIds } }] } });
  await prisma.adminAuditLog.deleteMany({ where: { adminUserId: { in: adminIds } } });
  await prisma.product.deleteMany({ where: { batchId: { in: batchIds } } });
  await prisma.batch.deleteMany({ where: { id: { in: batchIds } } });
  await prisma.farmer.deleteMany({ where: { id: { in: farmers.map((f) => f.id) } } });
  await prisma.adminUser.deleteMany({ where: { id: { in: adminIds } } });
  await prisma.$disconnect();
}
