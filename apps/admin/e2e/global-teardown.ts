import { prisma } from "./db";

/**
 * Removes everything the admin tests created: the test admins, the mills and varieties
 * named "PW …" with their batches and packs, and the audit and stock rows the test admins wrote.
 */
export default async function globalTeardown() {
  const admins = await prisma.adminUser.findMany({ where: { email: { startsWith: "playwright-", endsWith: "@kisa.test" } }, select: { id: true } });
  const adminIds = admins.map((a) => a.id);
  const mills = (await prisma.mill.findMany({ where: { name: { startsWith: "PW " } }, select: { id: true } })).map((m) => m.id);
  const varieties = (await prisma.variety.findMany({ where: { name: { startsWith: "PW " } }, select: { id: true } })).map((v) => v.id);
  const batchIds = (
    await prisma.batch.findMany({ where: { OR: [{ millId: { in: mills } }, { varietyId: { in: varieties } }] }, select: { id: true } })
  ).map((b) => b.id);

  await prisma.stockAdjustment.deleteMany({ where: { OR: [{ adminUserId: { in: adminIds } }, { batchId: { in: batchIds } }] } });
  await prisma.adminAuditLog.deleteMany({ where: { adminUserId: { in: adminIds } } });
  await prisma.product.deleteMany({ where: { batchId: { in: batchIds } } });
  await prisma.batch.deleteMany({ where: { id: { in: batchIds } } });
  await prisma.variety.deleteMany({ where: { id: { in: varieties } } });
  await prisma.mill.deleteMany({ where: { id: { in: mills } } });
  await prisma.adminUser.deleteMany({ where: { id: { in: adminIds } } });
  await prisma.$disconnect();
}
