import { expect, test, type Page } from "@playwright/test";

import { createTestDb, E2E_EMAIL_DOMAIN, E2E_EMAIL_PREFIX, E2E_VARIANT_PRODUCT_SLUG } from "./db";

const adminEmail = () => process.env.E2E_ADMIN_EMAIL!;
const adminPassword = () => process.env.E2E_ADMIN_PASSWORD ?? "123456";

async function signIn(page: Page) {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(adminEmail());
  await page.getByLabel("Password").fill(adminPassword());
  await page.getByRole("button", { name: "Sign In with credentials" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/sign-in"));
}

let productId = "";
let guestCartId: string | undefined;

test.beforeAll(async () => {
  const db = createTestDb();

  try {
    const product = await db.product.findUniqueOrThrow({
      where: { slug: E2E_VARIANT_PRODUCT_SLUG },
      select: { id: true },
    });
    productId = product.id;
  } finally {
    await db.$disconnect();
  }
});

const variantStock = async (title: string) => {
  const db = createTestDb();

  try {
    const variant = await db.productVariant.findFirstOrThrow({
      where: { productId, title },
      select: { stock: true },
    });
    return variant.stock;
  } finally {
    await db.$disconnect();
  }
};

test.afterAll(async () => {
  if (!guestCartId) return;

  const db = createTestDb();

  try {
    await db.cart.deleteMany({ where: { sessionCartId: guestCartId } });
  } finally {
    await db.$disconnect();
  }
});

test("admin adds variants; customers choose one and buy it", async ({ page, browser }) => {
  await test.step("admin sets up Size: S, M", async () => {
    await signIn(page);
    await page.goto(`/admin/products/${productId}`);

    await page.getByRole("button", { name: "Add option" }).click();
    await page.getByLabel("Option", { exact: true }).fill("Size");
    await page.getByLabel("Values, separated by commas").fill("S, M");
    await page.getByRole("button", { name: "Generate variants" }).click();

    await page.getByLabel("Stock for S").fill("0");
    await page.getByLabel("Price for M").fill("1200");
    await page.getByLabel("Stock for M").fill("3");
    await page.getByLabel("SKU for M").fill("E2E-BELT-M");

    await page.getByRole("button", { name: "Save variants" }).click();
    await expect(page.getByText("2 variants saved")).toBeVisible();

    // The main form now shows synced price and stock
    await expect(page.getByText("Lowest variant price.")).toBeVisible();
    await expect(page.getByLabel("Stock", { exact: true })).toHaveValue("3");
  });

  const visitor = await (await browser.newContext()).newPage();

  await test.step("customer sees the options and picks the one in stock", async () => {
    await visitor.goto(`/product/${E2E_VARIANT_PRODUCT_SLUG}`);

    // S is sold out, so the page starts on M
    await expect(visitor.getByRole("button", { name: "Size: M" })).toHaveAttribute("aria-pressed", "true");
    await expect(visitor.getByRole("button", { name: "Size: S (sold out)" })).toBeVisible();
    await expect(visitor.getByText("Only 3 left")).toBeVisible();
    await expect(visitor.getByText("1,200").first()).toBeVisible();

    // Choosing S shows it's out of stock and hides Add to cart
    await visitor.getByRole("button", { name: "Size: S (sold out)" }).click();
    await expect(visitor.getByText("Out of stock")).toBeVisible();
    await expect(visitor.getByRole("button", { name: "Add to cart" })).toHaveCount(0);

    await visitor.getByRole("button", { name: "Size: M" }).click();
    await visitor.getByRole("button", { name: "Add to cart" }).click();
    await expect(
      visitor.getByRole("button", { name: "Increase quantity of E2E Variant Belt" }),
    ).toBeVisible();

    guestCartId = (await visitor.context().cookies()).find((cookie) => cookie.name === "sessionCartId")?.value;
  });

  await test.step("the cart shows the chosen variant and price", async () => {
    await visitor.goto("/cart");

    const row = visitor.getByRole("row").filter({ hasText: "E2E Variant Belt" });
    await expect(row.getByText("M", { exact: true })).toBeVisible();
    await expect(row.getByText("₱1,200.00")).toBeVisible();
  });

  await test.step("search shows a From price", async () => {
    await visitor.goto("/search?q=E2E%20Variant");
    await expect(visitor.getByText("From", { exact: true })).toBeVisible();
  });

  await test.step("ordering the variant takes its stock; cancelling returns it", async () => {
    await visitor.goto("/cart");
    await visitor.getByRole("button", { name: "Proceed to Checkout" }).click();
    await visitor.waitForURL(/\/sign-in/);
    await visitor.getByRole("link", { name: "Sign Up" }).click();
    await visitor.waitForURL(/\/sign-up/);

    await visitor.getByLabel("Name", { exact: true }).fill("E2E Variant Buyer");
    await visitor.getByLabel("Email").fill(`${E2E_EMAIL_PREFIX}variant-${Date.now()}${E2E_EMAIL_DOMAIN}`);
    await visitor.getByLabel("Password", { exact: true }).fill("e2e-password");
    await visitor.getByLabel("Confirm Password").fill("e2e-password");
    await visitor.getByRole("button", { name: "Sign Up" }).click();
    await visitor.waitForURL(/\/shipping-address/);

    await visitor.getByLabel("Full name").fill("Juan dela Cruz");
    await visitor.getByLabel("Mobile number").fill("0917 123 4567");
    await visitor.getByLabel("House no., street, barangay").fill("123 Rizal St.");
    await visitor.getByLabel("City / municipality").fill("Quezon City");
    await visitor.getByLabel("Province").fill("Metro Manila");
    await visitor.getByLabel("ZIP code").fill("1100");
    await visitor.getByRole("button", { name: "Save and continue" }).click();
    await visitor.waitForURL(/\/payment-method/);

    await visitor.getByLabel("Cash on Delivery").check();
    await visitor.getByRole("button", { name: "Continue" }).click();
    await visitor.waitForURL(/\/place-order/);

    await visitor.getByRole("button", { name: "Place Order" }).click();
    await visitor.waitForURL(/\/order\/[0-9a-f-]{36}$/);

    const orderRow = visitor.getByRole("row").filter({ hasText: "E2E Variant Belt" });
    await expect(orderRow.getByText("M", { exact: true })).toBeVisible();
    expect(await variantStock("M")).toBe(2);

    await visitor.getByRole("button", { name: "Cancel order" }).click();
    await expect(visitor.getByText("Cancelled", { exact: true }).first()).toBeVisible();
    expect(await variantStock("M")).toBe(3);
  });
});
