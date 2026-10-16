// The website caches API data, and a change saved in the admin shows at once
// (the admin's server calls the website's POST /api/revalidate).
import { expect, test } from "@playwright/test";
import { ADMIN_URL } from "../playwright.config";
import { prisma, PRICE_TEST } from "./db";

const ADMIN = { email: process.env.E2E_WEB_ADMIN_EMAIL!, password: process.env.E2E_WEB_ADMIN_PASSWORD! };
const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const rupees = (paise: number) => inr.format(paise / 100);

test.afterAll(() => prisma.$disconnect());

test("the revalidate endpoint needs the secret and known tags", async ({ request }) => {
  expect((await request.post("/api/revalidate", { data: { tags: ["products"] } })).status()).toBe(401);
  expect((await request.post("/api/revalidate", { headers: { "x-revalidate-secret": "wrong" }, data: { tags: ["products"] } })).status()).toBe(401);
  const bad = await request.post("/api/revalidate", { headers: { "x-revalidate-secret": "e2e-revalidate-secret" }, data: { tags: ["<script>"] } });
  expect(bad.status()).toBe(400);
});

test("after a price change in the admin, the website shows the new price once revalidation runs", async ({ page, browser }) => {
  // Set by global-setup.ts (it runs before the tests, after this file is loaded).
  const before = JSON.parse(process.env.E2E_PRICE_BEFORE!) as { millPricePaise: number; kisaMarginPaise: number; pricePaise: number };
  const productUrl = `/product/${PRICE_TEST.slug}`;
  const price = page.getByTestId("product-price");
  const shopCard = page.locator(`[data-product-id="${PRICE_TEST.slug}"]`).getByTestId("card-price");

  await page.goto(productUrl);
  await expect(price).toHaveText(rupees(before.pricePaise));
  await page.goto("/shop");
  await expect(shopCard).toHaveText(rupees(before.pricePaise));

  // A change made behind the admin's back (straight in the database) is not shown: the data is cached.
  await prisma.product.update({ where: { slug: PRICE_TEST.slug }, data: { kisaMarginPaise: before.kisaMarginPaise + 5000, pricePaise: before.pricePaise + 5000 } });
  await page.goto(productUrl);
  await expect(price).toHaveText(rupees(before.pricePaise));
  await prisma.product.update({ where: { slug: PRICE_TEST.slug }, data: before });

  // Change the Kisa margin in the admin: +₹15.
  const newMargin = before.kisaMarginPaise / 100 + 15;
  const newPrice = rupees(before.pricePaise + 1500);
  const admin = await browser.newPage({ baseURL: ADMIN_URL });
  await admin.goto("/login");
  await admin.getByLabel("Email").fill(ADMIN.email);
  await admin.getByLabel("Password").fill(ADMIN.password);
  await admin.getByRole("button", { name: "Sign in" }).click();
  await expect(admin.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await admin.goto(`/catalogue/${PRICE_TEST.batchId}`);
  await admin.getByRole("button", { name: "Edit Sona Masoori, Steam 10 kg" }).click();
  const dialog = admin.getByRole("dialog");
  await dialog.getByLabel("Kisa margin (₹ per pack)").fill(String(newMargin));
  await dialog.getByRole("button", { name: "Save pack" }).click();
  await expect(admin.getByText("Pack updated")).toBeVisible();
  await admin.close();

  // The admin's save revalidated the product page and the shop list.
  await page.goto(productUrl);
  await expect(price).toHaveText(newPrice);
  await page.goto("/shop");
  await expect(shopCard).toHaveText(newPrice);
});
