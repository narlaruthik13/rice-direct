// The website with DATA_SOURCE=mock (what production runs until the API is deployed):
// its API_URL points where nothing listens, so every page must work from the snapshot.
import { expect, test } from "@playwright/test";
import snapshot from "../data/api-snapshot.json";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const product = snapshot.products.find((p) => p.featured && p.inStock)!;

test("with DATA_SOURCE=mock the site works with no API running", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Fresh from this season's milling" })).toBeVisible();
  await expect(page.locator(`[data-product-id="${product.id}"]`)).toBeVisible();

  await page.goto("/shop");
  await expect(page.getByTestId("product-card")).toHaveCount(snapshot.products.length);
  await page.getByRole("tab", { name: "Boiled" }).click();
  await expect(page.getByTestId("product-card")).toHaveCount(snapshot.products.filter((p) => p.riceType === "BOILED").length);

  await page.goto(`/product/${product.id}`);
  await expect(page.getByTestId("product-price")).toHaveText(inr.format(product.price));

  const res = await page.goto(`/trace/${product.batchId}`);
  expect(res?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Quality report" })).toBeVisible();

  expect((await page.goto("/product/no-such-rice-10kg"))?.status()).toBe(404);
  await expect(page.getByText("We're having trouble loading rice right now")).toHaveCount(0);
});
