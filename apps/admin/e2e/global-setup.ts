// Creates throwaway admins for this run (a STAFF and an ADMIN); their credentials
// reach the tests through environment variables. Removed in global-teardown.ts.
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma, TEST_ADMIN_NAME } from "./db";

export default async function globalSetup() {
  const run = randomUUID().slice(0, 6);
  const staff = { email: `playwright-staff-${run}@kisa.test`, password: `Pw-${randomUUID()}` };
  const admin = { email: `playwright-admin-${run}@kisa.test`, password: `Pw-${randomUUID()}` };
  await prisma.adminUser.create({
    data: { email: staff.email, name: TEST_ADMIN_NAME, role: "STAFF", passwordHash: await bcrypt.hash(staff.password, 10) },
  });
  await prisma.adminUser.create({
    data: { email: admin.email, name: "Playwright Owner", role: "ADMIN", passwordHash: await bcrypt.hash(admin.password, 10) },
  });
  await prisma.$disconnect();
  process.env.E2E_RUN = run;
  process.env.E2E_ADMIN_EMAIL = staff.email; // auth.spec.ts signs in as STAFF
  process.env.E2E_ADMIN_PASSWORD = staff.password;
  process.env.E2E_OWNER_EMAIL = admin.email;
  process.env.E2E_OWNER_PASSWORD = admin.password;
}
