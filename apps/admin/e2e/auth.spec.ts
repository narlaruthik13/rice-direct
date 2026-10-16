import { expect, type Page, test } from "@playwright/test";
import { ACCESS_TTL_SECONDS } from "../playwright.config";
import { prisma, TEST_ADMIN_NAME } from "./db";

const EMAIL = process.env.E2E_ADMIN_EMAIL!;
const PASSWORD = process.env.E2E_ADMIN_PASSWORD!;

// Login is rate limited per IP; the test API allows 30 a minute (see playwright.config.ts).
test.describe.configure({ mode: "serial" });

test.afterAll(() => prisma.$disconnect());

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page).toHaveURL("/");
}

const sessionsOf = async (email: string) => {
  const admin = await prisma.adminUser.findUniqueOrThrow({ where: { email } });
  return prisma.adminSession.findMany({ where: { adminUserId: admin.id }, orderBy: { createdAt: "asc" } });
};

const waitForAccessTokenToExpire = (page: Page) => page.waitForTimeout(ACCESS_TTL_SECONDS * 1000 + 1500);

test("a protected page redirects to /login when logged out", async ({ page }) => {
  await page.goto("/mills");
  await expect(page).toHaveURL("/login?next=%2Fmills");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("shows inline validation errors without calling the server", async ({ page }) => {
  const calls: string[] = [];
  page.on("request", (r) => r.url().includes("/api/auth/login") && calls.push(r.url()));
  await page.goto("/login");
  await page.getByLabel("Email").fill("not-an-email");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Enter a valid email address.")).toBeVisible();
  await expect(page.getByText("Password is required")).toBeVisible();
  expect(calls).toHaveLength(0);
});

test("a wrong password shows the API's error", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Password").fill("definitely-wrong");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByTestId("form-error")).toHaveText("Invalid email or password");
  await expect(page).toHaveURL("/login");
});

test("shows a friendly message when sign-in is rate limited", async ({ page }) => {
  // Simulated, so the test does not use up the real login limit.
  await page.route("**/api/auth/login", (route) =>
    route.fulfill({ status: 429, json: { message: "Too many sign-in attempts. Please wait a minute and try again." } }),
  );
  await page.goto("/login");
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByTestId("form-error")).toHaveText("Too many sign-in attempts. Please wait a minute and try again.");
});

test("login goes to the dashboard; tokens stay in httpOnly cookies", async ({ page, context }) => {
  const loginResponse = page.waitForResponse("**/api/auth/login");
  await signIn(page);

  // The browser gets only the profile, never a token.
  const body = await (await loginResponse).json();
  expect(Object.keys(body)).toEqual(["admin"]);
  expect(body.admin.email).toBe(EMAIL);

  const cookies = await context.cookies();
  for (const name of ["kisa_admin_at", "kisa_admin_rt"]) {
    const cookie = cookies.find((c) => c.name === name);
    expect(cookie, name).toBeDefined();
    expect(cookie).toMatchObject({ httpOnly: true, sameSite: "Lax", path: "/" });
  }
  expect(await page.evaluate(() => document.cookie)).not.toContain("kisa_admin");

  await expect(page.getByTestId("admin-name")).toHaveText(TEST_ADMIN_NAME);
  await expect(page.getByTestId("admin-role")).toHaveText("Staff");
  await expect(page.getByText("Active products", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Orders" }).click();
  await expect(page.getByRole("heading", { name: "Orders" })).toBeVisible();
  await expect(page.getByText("Coming soon")).toBeVisible();

  // A signed-in admin visiting /login goes back to the dashboard.
  await page.goto("/login");
  await expect(page).toHaveURL("/");
});

test("stays logged in after the access token expires, with one refresh for parallel requests", async ({ page }) => {
  await signIn(page);
  expect(await sessionsOf(EMAIL).then((s) => s.filter((x) => !x.revokedAt).length)).toBeGreaterThan(0);
  const before = (await sessionsOf(EMAIL)).length;

  await waitForAccessTokenToExpire(page);
  // Six requests at once, all carrying the same expired access token and refresh token.
  const results = await page.evaluate(async () => {
    const paths = ["/", "/orders", "/mills", "/varieties", "/delivery", "/settings"];
    const responses = await Promise.all(paths.map((p) => fetch(p, { redirect: "manual" })));
    return responses.map((r) => r.status);
  });
  expect(results).toEqual([200, 200, 200, 200, 200, 200]);

  // Exactly one rotation (single-flight): one new session, and the token-reuse
  // protection did not fire (the newest session is still active).
  const after = await sessionsOf(EMAIL);
  expect(after.length).toBe(before + 1);
  expect(after[after.length - 1].revokedAt).toBeNull();

  await page.reload();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  // And again through normal navigation after another expiry.
  await waitForAccessTokenToExpire(page);
  await page.getByRole("link", { name: "Mills" }).click();
  await expect(page.getByRole("heading", { name: "Mills" })).toBeVisible();
  await expect(page).toHaveURL("/mills");
  const latest = await sessionsOf(EMAIL);
  expect(latest[latest.length - 1].revokedAt).toBeNull();
});

test("logout ends the session", async ({ page, context }) => {
  await signIn(page);
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL("/login?reason=signed-out");
  await expect(page.getByText("You have signed out.")).toBeVisible();

  const names = (await context.cookies()).map((c) => c.name);
  expect(names).not.toContain("kisa_admin_at");
  expect(names).not.toContain("kisa_admin_rt");

  const sessions = await sessionsOf(EMAIL);
  expect(sessions[sessions.length - 1].revokedAt).not.toBeNull();

  await page.goto("/");
  await expect(page).toHaveURL("/login");
});
