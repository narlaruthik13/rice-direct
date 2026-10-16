import { ADMIN_EMAIL_PREFIX, prisma, PRICE_TEST } from "./db";

/** Restores the test pack's price and removes the test admin with the audit rows it wrote. */
export default async function globalTeardown() {
  const before = process.env.E2E_PRICE_BEFORE;
  if (before) await prisma.product.update({ where: { slug: PRICE_TEST.slug }, data: JSON.parse(before) });

  const admins = await prisma.adminUser.findMany({ where: { email: { startsWith: ADMIN_EMAIL_PREFIX, endsWith: "@kisa.test" } }, select: { id: true } });
  const adminIds = admins.map((a) => a.id);
  await prisma.adminAuditLog.deleteMany({ where: { adminUserId: { in: adminIds } } });
  await prisma.adminUser.deleteMany({ where: { id: { in: adminIds } } });
  await prisma.$disconnect();
}
