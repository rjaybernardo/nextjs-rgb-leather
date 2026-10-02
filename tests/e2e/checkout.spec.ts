import { expect, test, type Page } from "@playwright/test";

import { E2E_COUPON_CODE, E2E_EMAIL_DOMAIN, E2E_EMAIL_PREFIX } from "./db";

const productSlug = () => process.env.E2E_PRODUCT_SLUG!;
const productName = () => process.env.E2E_PRODUCT_NAME!;

// The seed's admin; override with E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD
const adminEmail = () => process.env.E2E_ADMIN_EMAIL!;
const adminPassword = () => process.env.E2E_ADMIN_PASSWORD ?? "123456";

const TRACKING_NUMBER = "JT-E2E-0001";

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign In with credentials" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/sign-in"));
}

test("guest cart → sign up → checkout with COD → shipped → delivered and paid", async ({
  page,
  browser,
}) => {
  const email = `${E2E_EMAIL_PREFIX}${Date.now()}${E2E_EMAIL_DOMAIN}`;

  await test.step("guest adds a product to the cart", async () => {
    await page.goto(`/product/${productSlug()}`);
    await page.getByRole("button", { name: "Add to cart" }).click();

    // The button turns into quantity controls once the item is in the cart
    await expect(
      page.getByRole("button", { name: `Increase quantity of ${productName()}` }),
    ).toBeVisible();

    await page.goto("/cart");
    await expect(page.getByRole("link", { name: productName() }).first()).toBeVisible();
  });

  await test.step("checkout asks the guest to sign in; they sign up instead", async () => {
    await page.getByRole("button", { name: "Proceed to Checkout" }).click();
    await page.waitForURL(/\/sign-in/);

    await page.getByRole("link", { name: "Sign Up" }).click();
    await page.waitForURL(/\/sign-up/);

    await page.getByLabel("Name", { exact: true }).fill("E2E Tester");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill("e2e-password");
    await page.getByLabel("Confirm Password").fill("e2e-password");
    await page.getByRole("button", { name: "Sign Up" }).click();

    // Back into checkout, with the guest cart carried over
    await page.waitForURL(/\/shipping-address/);
  });

  await test.step("adds a Philippine shipping address", async () => {
    await page.getByLabel("Full name").fill("Juan dela Cruz");
    await page.getByLabel("Mobile number").fill("0917 123 4567");
    await page.getByLabel("House no., street, barangay").fill("123 Rizal St., Brgy. San Antonio");
    await page.getByLabel("City / municipality").fill("Quezon City");
    await page.getByLabel("Province").fill("Metro Manila");
    await page.getByLabel("ZIP code").fill("1100");
    await page.getByRole("button", { name: "Save and continue" }).click();

    await page.waitForURL(/\/payment-method/);
  });

  await test.step("chooses cash on delivery", async () => {
    await page.getByLabel("Cash on Delivery").check();
    await page.getByRole("button", { name: "Continue" }).click();

    await page.waitForURL(/\/place-order/);
  });

  let orderUrl = "";

  await test.step("reviews and places the order", async () => {
    await expect(page.getByText(productName()).first()).toBeVisible();
    await expect(page.getByRole("main").getByText("Cash on Delivery")).toBeVisible();
    await expect(page.getByText("+639171234567")).toBeVisible();
    await expect(page.getByText("Includes 12% VAT")).toBeVisible();

    // A wrong code is explained, the real one applies 10% off
    await page.getByLabel("Have a discount code?").fill("NOPE123");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText("NOPE123 isn't a valid discount code")).toBeVisible();

    await page.getByLabel("Have a discount code?").fill(E2E_COUPON_CODE.toLowerCase());
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText(`Discount (${E2E_COUPON_CODE})`)).toBeVisible();

    await page.getByRole("button", { name: "Place Order" }).click();
    await page.waitForURL(/\/order\/[0-9a-f-]{36}$/);
    orderUrl = page.url();

    await expect(page.getByText("Pending", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Pay on delivery")).toBeVisible();
    await expect(page.getByText(`Discount (${E2E_COUPON_CODE})`)).toBeVisible();
  });

  await test.step("admin ships the order with a courier and tracking number", async () => {
    const adminContext = await browser.newContext();
    const admin = await adminContext.newPage();

    await signIn(admin, adminEmail(), adminPassword());
    await admin.goto(orderUrl);

    await admin.getByLabel("Courier").selectOption("J&T Express");
    await admin.getByLabel("Tracking number (optional)").fill(TRACKING_NUMBER);
    await admin.getByRole("button", { name: "Mark as shipped" }).click();

    await expect(admin.getByText("Shipped", { exact: true }).first()).toBeVisible();
    await expect(admin.getByText(TRACKING_NUMBER)).toBeVisible();

    await admin.getByRole("button", { name: "Mark as delivered (cash collected)" }).click();

    await expect(admin.getByText("Delivered", { exact: true }).first()).toBeVisible();
    await expect(admin.getByText(/^Paid on /)).toBeVisible();

    // The code shows one use in Admin → Discounts
    await admin.goto("/admin/discounts");
    const couponRow = admin.getByRole("row").filter({ hasText: E2E_COUPON_CODE });
    await expect(couponRow.getByRole("cell").nth(3)).toHaveText("1");

    await adminContext.close();
  });

  await test.step("customer sees the order delivered and paid, with tracking", async () => {
    await page.goto(orderUrl);

    await expect(page.getByText("Delivered", { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/^Paid on /)).toBeVisible();
    await expect(page.getByText("J&T Express")).toBeVisible();
    await expect(page.getByText(TRACKING_NUMBER)).toBeVisible();

    // Admin-only controls stay hidden from the customer
    await expect(page.getByRole("button", { name: "Edit tracking" })).toHaveCount(0);
  });
});
