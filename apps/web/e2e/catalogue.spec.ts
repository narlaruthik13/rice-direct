// The website with DATA_SOURCE=api: pages show what the test API returns.
import { expect, test } from "@playwright/test";
import type { Product, ProductDetailResponse, ProductListResponse } from "@kisa/shared";
import { API_URL } from "../playwright.config";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

async function api<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}/api/v1${path}`);
  expect(res.ok, `GET ${path}`).toBe(true);
  return (await res.json()) as T;
}

/** Seeded products only: the admin suite may be adding and removing its own "PW …" packs at the same time. */
const seeded = (products: Product[]) => products.filter((p) => !p.variety.name.startsWith("PW "));

test("the shop shows the API's products, and the type tabs filter them", async ({ page }) => {
  const all = seeded((await api<ProductListResponse>("/products")).products);
  expect(all.length).toBeGreaterThan(5);

  await page.goto("/shop");
  const cards = page.getByTestId("product-card");
  for (const p of all) {
    const card = page.locator(`[data-testid="product-card"][data-product-id="${p.id}"]`);
    await expect(card).toBeVisible();
    await expect(card.getByTestId("card-price")).toHaveText(inr.format(p.price));
  }

  await page.getByRole("tab", { name: "Steam" }).click();
  await expect(page).toHaveURL(/type=STEAM/);
  const steam = all.filter((p) => p.riceType === "STEAM");
  expect(steam.length).toBeGreaterThan(0);
  for (const p of steam) await expect(page.locator(`[data-product-id="${p.id}"]`)).toBeVisible();
  for (const p of all.filter((p) => p.riceType !== "STEAM")) await expect(page.locator(`[data-product-id="${p.id}"]`)).toHaveCount(0);
  // Whatever else is listed (another suite's packs included) is steam rice too.
  const ids = await cards.evaluateAll((els) => els.map((el) => el.getAttribute("data-product-id")));
  const { products: apiSteam } = await api<ProductListResponse>("/products?riceType=STEAM");
  for (const id of ids) expect(apiSteam.map((p) => p.id)).toContain(id);
});

test("a product page loads by slug", async ({ page }) => {
  const slug = "sona-masoori-raw-new-10kg";
  const { product, passport } = await api<ProductDetailResponse>(`/products/${slug}`);

  const res = await page.goto(`/product/${slug}`);
  expect(res?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: product.name })).toBeVisible();
  await expect(page.getByTestId("product-price")).toHaveText(inr.format(product.price));
  await expect(page.getByTestId("quality-grade")).toBeVisible();
  await expect(page.getByRole("link", { name: "See the Quality Passport" })).toHaveAttribute("href", `/trace/${passport.batchId}`);
});

test("a Quality Passport loads", async ({ page }) => {
  const batchId = "KS-2026-0904-SM";
  const res = await page.goto(`/trace/${batchId}`);
  expect(res?.status()).toBe(200);
  await expect(page.getByText("Quality Passport", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Sona Masoori, Raw" })).toBeVisible();
  await expect(page.getByText(batchId).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Quality report" })).toBeVisible();
  // No mill names (the seeded mills) and no farmers on the public page.
  await expect(page.locator("main").getByText(/Godavari|Kakatiya|Miryalaguda|farmer/i)).toHaveCount(0);
});

test("unknown products and batches give the normal 404 page", async ({ page }) => {
  for (const path of ["/product/no-such-rice-10kg", "/trace/KS-0000-NONE"]) {
    const res = await page.goto(path);
    expect(res?.status(), path).toBe(404);
    await expect(page.getByText("This page could not be found.")).toBeVisible();
  }
});

test("the home page's hero bag and featured packs come from the API", async ({ page }) => {
  const { products } = await api<ProductListResponse>("/products");
  const hero = products.find((p) => p.featured && p.inStock) ?? products[0];

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Fresh from this season's milling" })).toBeVisible();
  for (const p of seeded(products).filter((p) => p.featured)) await expect(page.locator(`[data-product-id="${p.id}"]`)).toBeVisible();
  // The footer's sample Quality Passport is the hero pack's batch.
  await expect(page.getByRole("contentinfo").getByRole("link", { name: "A Quality Passport" })).toHaveAttribute("href", `/trace/${hero.batchId}`);
});
