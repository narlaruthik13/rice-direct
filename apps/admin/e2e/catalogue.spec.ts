import { expect, type Page, test } from "@playwright/test";

const run = process.env.E2E_RUN!;
const OWNER = { email: process.env.E2E_OWNER_EMAIL!, password: process.env.E2E_OWNER_PASSWORD! };
const STAFF = { email: process.env.E2E_ADMIN_EMAIL!, password: process.env.E2E_ADMIN_PASSWORD! };
const FARMER = `PW Farmer ${run}`; // "PW " prefix: removed by global-teardown
const PACK = `PW Sona ${run}`;

test.describe.configure({ mode: "serial" });

async function signIn(page: Page, who: { email: string; password: string }) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(who.email);
  await page.getByLabel("Password").fill(who.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
}

let page: Page; // one ADMIN session for the ADMIN flows
let farmerId = "";
let batchUrl = "";

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
  await signIn(page, OWNER);
});
test.afterAll(() => page.close());

test("ADMIN creates a farmer", async () => {
  await page.getByRole("link", { name: "Farmers" }).click();
  await page.getByRole("link", { name: "New farmer" }).click();
  await expect(page.getByRole("heading", { name: "New farmer" })).toBeVisible();

  // Inline validation first.
  await page.getByRole("button", { name: "Add farmer" }).click();
  await expect(page.getByText("At least 2 characters").first()).toBeVisible();

  await page.getByLabel("Name").fill(FARMER);
  await page.getByLabel("Mobile number").fill("9123456780");
  await page.getByLabel("Village").fill("Kollapur");
  await page.getByLabel("District").fill("Nagarkurnool");
  await page.getByLabel("Farming method").selectOption("natural");
  await page.getByLabel("Farm size (acres)").fill("4.5");
  await page.getByLabel("Years farming").fill("12");
  await page.getByLabel("Story").fill("Grows paddy with natural farming on the Krishna backwaters.");
  await page.getByRole("button", { name: "Add farmer" }).click();

  await expect(page.getByText(`Added ${FARMER}`)).toBeVisible(); // toast
  await expect(page.getByRole("heading", { name: FARMER })).toBeVisible();
  farmerId = page.url().split("/farmers/")[1];
  expect(farmerId).toBeTruthy();

  // It shows in the list, found by search.
  await page.goto("/farmers");
  await page.getByPlaceholder("Search name, village, district or phone").fill(run);
  await expect(page.getByRole("link", { name: FARMER })).toBeVisible();
  await expect(page.getByText("1–1 of 1")).toBeVisible();
});

test("ADMIN creates a batch with a pack through the wizard", async () => {
  await page.goto("/catalogue/new");
  await page.getByRole("radio", { name: /Rice/ }).check();
  await page.getByRole("button", { name: "Next" }).click();

  await expect(page.getByRole("heading", { name: "Sales model" })).toBeVisible();
  await page.getByRole("radio", { name: /Farmer-owned/ }).check();
  await page.getByRole("button", { name: "Next" }).click();

  await page.getByLabel("Farmer", { exact: true }).selectOption(farmerId);
  await page.getByLabel("Mill", { exact: true }).selectOption("mill-godavari");
  await page.getByRole("button", { name: "Next" }).click();

  await page.getByLabel("Variety").selectOption("Sona Masoori");
  await page.getByLabel("Harvest date").fill("2026-05-02");
  await page.getByLabel("Packed date").fill("2026-09-10");
  await page.getByLabel("Raw paddy in (kg)").fill("1000");
  await page.getByLabel("Sellable out (kg)").fill("650");
  // Output above input is caught before moving on.
  await page.getByLabel("Sellable out (kg)").fill("1200");
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByText("Output can't be more than input")).toBeVisible();
  await page.getByLabel("Sellable out (kg)").fill("650");
  await page.getByRole("button", { name: "Next" }).click();

  await page.getByLabel("Milling date").fill("2026-09-08");
  await page.getByLabel("Moisture %").fill("12.6");
  await page.getByLabel("Broken grains %").fill("2.1");
  await page.getByLabel("Foreign matter %").fill("0.1");
  await page.getByLabel("Grain length (mm)").fill("5.1");
  await page.getByLabel("Tested by").fill("Sri Godavari mill lab");
  await page.getByLabel("Tested on").fill("2026-09-09");
  await page.getByRole("button", { name: "Next" }).click();

  // One pack is added for us. 5 kg: platform fee 5 × ₹3, processing fee 5 × ₹4.
  await expect(page.getByRole("heading", { name: "Packs & prices" })).toBeVisible();
  await expect(page.getByLabel("Platform fee (₹)")).toHaveValue("15");
  await expect(page.getByLabel("Processing fee (₹)")).toHaveValue("20");
  await page.getByLabel("Product name").fill(PACK);
  await page.getByLabel("Farmer's share (₹)").fill("300");
  await expect(page.getByTestId("preview-price")).toHaveText("₹335");
  await expect(page.getByTestId("price-preview")).toContainText("(89.6%)");
  await page.getByLabel("Description").fill("New-crop Sona Masoori from a natural farm.");
  await page.getByRole("button", { name: "Next" }).click();

  await expect(page.getByRole("heading", { name: "Review" })).toBeVisible();
  await expect(page.getByText(`${PACK} · 5 kg`)).toBeVisible();
  // Reaching Review must not have created anything yet.
  await page.waitForTimeout(1000);
  await expect(page).toHaveURL("/catalogue/new");
  await page.getByRole("button", { name: "Create batch" }).click();

  // Exactly one batch: the variety code is free, so the id ends in SM (Sona Masoori).
  await expect(page).toHaveURL(/\/catalogue\/KS-2026-0910-SM$/);
  batchUrl = new URL(page.url()).pathname;
  await expect(page.getByTestId("available-kg")).toHaveText("650 kg");
  await expect(page.getByText(PACK, { exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "₹335" })).toBeVisible();
  await expect(page.getByText("Batch · create")).toBeVisible(); // audit history
});

test("adjusts stock on the batch page", async () => {
  await page.goto(batchUrl);
  await page.getByRole("button", { name: "Adjust stock" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Kilograms").fill("700");
  await expect(dialog.getByText("can't go below 0")).toBeVisible();
  await dialog.getByLabel("Kilograms").fill("5");
  await dialog.getByLabel("Reason").selectOption("DAMAGED");
  await dialog.getByLabel("Note").fill("Torn bags in transit");
  await dialog.getByRole("button", { name: "Save adjustment" }).click();

  await expect(page.getByText("Stock is now 645 kg")).toBeVisible();
  await expect(page.getByTestId("available-kg")).toHaveText("645 kg");
  await expect(page.getByTestId("stock-history")).toContainText("-5 kg");
  await expect(page.getByTestId("stock-history")).toContainText("Torn bags in transit");
});

test("links to the public trace page and downloads a QR code PNG", async ({ browser }) => {
  const batchId = batchUrl.split("/").pop()!;
  await page.goto(batchUrl);
  await expect(page.getByRole("link", { name: "Trace page" })).toHaveAttribute("href", `http://localhost:3000/trace/${batchId}`);

  const res = await page.request.get(`/api/qr/${batchId}`);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toBe("image/png");
  expect(res.headers()["content-disposition"]).toContain(`kisa-trace-${batchId}.png`);
  const png = await res.body();
  expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a"); // PNG signature

  // Behind the login.
  const anon = await browser.newContext();
  const blocked = await anon.request.get(`http://localhost:3101/api/qr/${batchId}`, { maxRedirects: 0 });
  expect(blocked.status()).toBe(307);
  await anon.close();
});

test("STAFF can view and adjust stock, but can't edit", async ({ browser }) => {
  const staff = await browser.newPage();
  await signIn(staff, STAFF);

  await staff.goto("/farmers");
  await expect(staff.getByRole("heading", { name: "Farmers" })).toBeVisible();
  await expect(staff.getByRole("link", { name: "New farmer" })).toHaveCount(0);

  await staff.goto(`/farmers/${farmerId}`);
  await expect(staff.getByLabel("Name")).toBeDisabled();
  await expect(staff.getByRole("button", { name: "Save changes" })).toHaveCount(0);
  await expect(staff.getByRole("button", { name: "Deactivate" })).toHaveCount(0);

  await staff.goto("/farmers/new");
  await expect(staff.getByText("Admins only")).toBeVisible();

  await staff.goto(batchUrl);
  await expect(staff.getByRole("button", { name: "Adjust stock" })).toBeVisible();
  await expect(staff.getByRole("link", { name: "Edit batch" })).toHaveCount(0);
  await expect(staff.getByRole("button", { name: "Add a pack" })).toHaveCount(0);

  await staff.goto(`${batchUrl}/edit`);
  await expect(staff.getByText("Admins only")).toBeVisible();
  await staff.close();
});
