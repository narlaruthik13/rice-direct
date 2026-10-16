import { expect, type Page, test } from "@playwright/test";

const run = process.env.E2E_RUN!;
const OWNER = { email: process.env.E2E_OWNER_EMAIL!, password: process.env.E2E_OWNER_PASSWORD! };
const STAFF = { email: process.env.E2E_ADMIN_EMAIL!, password: process.env.E2E_ADMIN_PASSWORD! };
// "PW " prefix: removed by global-teardown.
const MILL = `PW Mill ${run}`;
const VARIETY = `PW Kolam ${run}`;
const VARIETY_RENAMED = `PW Kolam Rice ${run}`;

test.describe.configure({ mode: "serial" });

async function signIn(page: Page, who: { email: string; password: string }) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(who.email);
  await page.getByLabel("Password").fill(who.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
}

let page: Page; // one ADMIN session for the ADMIN flows
let millId = "";
let batchUrl = "";

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
  await signIn(page, OWNER);
});
test.afterAll(() => page.close());

test("the dashboard shows best-before within 30 days, and nothing about farmers or onions", async () => {
  await expect(page.getByRole("heading", { name: "Best before within 30 days" })).toBeVisible();
  await expect(page.getByText(/onion|farmer/i)).toHaveCount(0);
  const nav = page.getByRole("navigation", { name: "Admin" });
  await expect(nav.getByRole("link", { name: "Mills" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Varieties" })).toBeVisible();
  await expect(nav.getByRole("link", { name: /Farmers|Partners/ })).toHaveCount(0);
});

test("ADMIN creates a mill", async () => {
  await page.getByRole("link", { name: "Mills" }).click();
  await page.getByRole("link", { name: "New mill" }).click();
  await expect(page.getByRole("heading", { name: "New mill" })).toBeVisible();

  // Shared-schema validation first.
  await page.getByLabel("FSSAI licence number").fill("123");
  await page.getByRole("button", { name: "Add mill" }).click();
  await expect(page.getByText("At least 2 characters").first()).toBeVisible();
  await expect(page.getByText("14-digit FSSAI licence number")).toBeVisible();

  await page.getByLabel("Mill name").fill(MILL);
  await page.getByLabel("Contact person").fill("Test Contact");
  await page.getByLabel("FSSAI licence number").fill("10012345678901");
  await page.getByLabel("Town").fill("Suryapet");
  await page.getByLabel("District").fill("Suryapet");
  await page.getByRole("button", { name: "Add mill" }).click();

  await expect(page.getByText(`Added ${MILL}`)).toBeVisible();
  await expect(page.getByRole("heading", { name: MILL })).toBeVisible();
  millId = page.url().split("/mills/")[1];
  expect(millId).toBeTruthy();

  await page.goto("/mills");
  await page.getByPlaceholder("Search mill, town, district or contact").fill(run);
  await expect(page.getByRole("link", { name: MILL })).toBeVisible();
  await expect(page.getByText("1–1 of 1")).toBeVisible();
});

test("ADMIN creates and renames a variety", async () => {
  await page.goto("/varieties");
  await page.getByRole("button", { name: "New variety" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Variety name").fill(VARIETY);
  await dialog.getByRole("button", { name: "Add variety" }).click();
  await expect(page.getByText(`Added ${VARIETY}`)).toBeVisible();

  // A duplicate name is refused, with the API's message under the field.
  await page.getByRole("button", { name: "New variety" }).click();
  await dialog.getByLabel("Variety name").fill(VARIETY);
  await dialog.getByRole("button", { name: "Add variety" }).click();
  await expect(dialog.getByText(`A variety called "${VARIETY}" already exists`)).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();

  await page.getByRole("button", { name: `Rename ${VARIETY}` }).click();
  await dialog.getByLabel("Variety name").fill(VARIETY_RENAMED);
  await dialog.getByRole("button", { name: "Save name" }).click();
  await expect(page.getByText(`Renamed to ${VARIETY_RENAMED}`)).toBeVisible();
  // The link name (slug) keeps the original name.
  const row = page.getByRole("row", { name: new RegExp(VARIETY_RENAMED) });
  await expect(row).toContainText(`pw-kolam-${run}`);
});

test("ADMIN creates a batch through the wizard: mill → variety → type → age → dates → quality → packs", async () => {
  await page.goto("/catalogue/new");
  const next = page.getByRole("button", { name: "Next" });

  await next.click(); // nothing chosen
  await expect(page.getByText("Choose a mill")).toBeVisible();
  await page.getByRole("radio", { name: new RegExp(MILL) }).check();
  await next.click();

  await page.getByRole("radio", { name: VARIETY_RENAMED }).check();
  await next.click();

  await expect(page.getByRole("heading", { name: "Type" })).toBeVisible();
  await next.click();
  await expect(page.getByText("Choose raw, steam or boiled")).toBeVisible();
  await page.getByRole("radio", { name: /^Steam/ }).check();
  await next.click();

  await page.getByRole("radio", { name: /^Aged/ }).check();
  await next.click();

  await expect(page.getByRole("heading", { name: "Dates" })).toBeVisible();
  await page.getByLabel("Milling date").fill("2026-09-12");
  await page.getByLabel("Packed date").fill("2026-09-10");
  await page.getByLabel("Kg packed in Kisa bags").fill("650");
  // Best-before follows the packed date: + 365 days.
  await expect(page.getByLabel("Best before")).toHaveValue("2027-09-10");
  await next.click();
  await expect(page.getByText("Packed date can't be before milling")).toBeVisible();
  await page.getByLabel("Milling date").fill("2026-09-08");
  await next.click();

  await expect(page.getByRole("heading", { name: "Quality" })).toBeVisible();
  await page.getByLabel("Moisture %").fill("12.6");
  await page.getByLabel("Broken grains %").fill("2.1");
  await page.getByLabel("Foreign matter %").fill("0.1");
  await page.getByLabel("Grain length (mm)").fill("5.1");
  await page.getByLabel("Tested by").fill("Kisa QC lab");
  await page.getByLabel("Tested on").fill("2026-09-09");
  await next.click();

  // One pack is added for us, named from the choices so far.
  await expect(page.getByRole("heading", { name: "Packs & prices" })).toBeVisible();
  await expect(page.getByLabel("Product name")).toHaveValue(`Aged ${VARIETY_RENAMED}, Steam`);
  await page.getByLabel("Pack size").selectOption("10");
  await page.getByLabel("Mill price (₹ per pack)").fill("560");
  await page.getByLabel("Kisa margin (₹ per pack)").fill("75");
  await expect(page.getByTestId("preview-price")).toHaveText("₹635");
  await expect(page.getByTestId("preview-margin")).toContainText("(11.8%)");
  await page.getByLabel("Description").fill("Steamed and aged: firm grains that stay separate.");
  await next.click();

  await expect(page.getByRole("heading", { name: "Review" })).toBeVisible();
  await expect(page.getByText(`Aged ${VARIETY_RENAMED}, Steam · 10 kg`)).toBeVisible();
  // Reaching Review must not have created anything yet.
  await page.waitForTimeout(800);
  await expect(page).toHaveURL("/catalogue/new");
  await page.getByRole("button", { name: "Create batch" }).click();

  // "PW Kolam Rice …" → variety code PK. Creating writes the batch, pack and audit rows
  // in one transaction to the database in Singapore, then renders the new page: allow time.
  await expect(page).toHaveURL(/\/catalogue\/KS-2026-0910-PK$/, { timeout: 20_000 });
  batchUrl = new URL(page.url()).pathname;
  await expect(page.getByTestId("available-kg")).toHaveText("650 kg");
  await expect(page.getByTestId("batch-mill")).toHaveText(MILL); // admin sees the mill
  await expect(page.getByRole("cell", { name: "₹635" })).toBeVisible();
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

test("QR code and printable labels show only Kisa, variety, type, pack size and batch id", async ({ browser }) => {
  const batchId = batchUrl.split("/").pop()!;
  await page.goto(batchUrl);
  await expect(page.getByRole("link", { name: "Quality Passport" })).toHaveAttribute("href", `http://localhost:3000/trace/${batchId}`);

  const res = await page.request.get(`/api/qr/${batchId}`);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toBe("image/png");
  expect((await res.body()).subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a"); // PNG signature

  await page.goto(`/labels/${batchId}`);
  const labels = page.getByTestId("bag-label");
  await expect(labels).toHaveCount(1); // one active pack size (10 kg)
  const label = labels.first();
  await expect(label.getByRole("img", { name: "Kisa" })).toBeVisible();
  await expect(label).toContainText(VARIETY_RENAMED);
  await expect(label).toContainText("Steam");
  await expect(label).toContainText("10 kg");
  await expect(label).toContainText(batchId);
  await expect(label.getByRole("img", { name: "QR code for the Quality Passport" })).toBeVisible();
  // Labels go to customers: no mill on the labels, and the mill's name and town nowhere on the page.
  const labelText = (await labels.allInnerTexts()).join(" ").toLowerCase();
  expect(labelText).not.toContain("mill");
  const text = (await page.locator("body").innerText()).toLowerCase();
  expect(text).not.toContain(MILL.toLowerCase());
  expect(text).not.toContain("suryapet");

  // Both are behind the login.
  const anon = await browser.newContext();
  expect((await anon.request.get(`http://localhost:3101/api/qr/${batchId}`, { maxRedirects: 0 })).status()).toBe(307);
  expect((await anon.request.get(`http://localhost:3101/labels/${batchId}`, { maxRedirects: 0 })).status()).toBe(307);
  await anon.close();
});

test("STAFF can view and adjust stock, but can't edit", async ({ browser }) => {
  const staff = await browser.newPage();
  await signIn(staff, STAFF);

  await staff.goto("/mills");
  await expect(staff.getByRole("heading", { name: "Mills" })).toBeVisible();
  await expect(staff.getByRole("link", { name: "New mill" })).toHaveCount(0);
  await staff.goto(`/mills/${millId}`);
  await expect(staff.getByLabel("Mill name")).toBeDisabled();
  await expect(staff.getByRole("button", { name: "Save changes" })).toHaveCount(0);
  await expect(staff.getByRole("button", { name: "Deactivate" })).toHaveCount(0);
  await staff.goto("/mills/new");
  await expect(staff.getByText("Admins only")).toBeVisible();

  await staff.goto("/varieties");
  await expect(staff.getByRole("heading", { name: "Varieties" })).toBeVisible();
  await expect(staff.getByRole("button", { name: "New variety" })).toHaveCount(0);
  await expect(staff.getByRole("button", { name: /^Rename/ })).toHaveCount(0);

  await staff.goto(batchUrl);
  await expect(staff.getByRole("button", { name: "Adjust stock" })).toBeVisible();
  await expect(staff.getByRole("link", { name: "Edit batch" })).toHaveCount(0);
  await expect(staff.getByRole("button", { name: "Add a pack" })).toHaveCount(0);
  await staff.goto(`${batchUrl}/edit`);
  await expect(staff.getByText("Admins only")).toBeVisible();
  await staff.goto("/catalogue/new");
  await expect(staff.getByText("Admins only")).toBeVisible();
  await staff.close();
});
