// Creates a throwaway ADMIN for the price test and remembers the pack's price, so
// global-teardown.ts can restore it. Credentials reach the tests through environment variables.
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { ADMIN_EMAIL_PREFIX, prisma, PRICE_TEST } from "./db";

export default async function globalSetup() {
  const run = randomUUID().slice(0, 6);
  const admin = { email: `${ADMIN_EMAIL_PREFIX}${run}@kisa.test`, password: `Pw-${randomUUID()}` };
  await prisma.adminUser.create({
    data: { email: admin.email, name: "Web E2E Admin", role: "ADMIN", passwordHash: await bcrypt.hash(admin.password, 10) },
  });
  const product = await prisma.product.findUniqueOrThrow({
    where: { slug: PRICE_TEST.slug },
    select: { millPricePaise: true, kisaMarginPaise: true, pricePaise: true },
  });
  await prisma.$disconnect();
  process.env.E2E_WEB_ADMIN_EMAIL = admin.email;
  process.env.E2E_WEB_ADMIN_PASSWORD = admin.password;
  process.env.E2E_PRICE_BEFORE = JSON.stringify(product);
}
