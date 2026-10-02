import { expect, test, type Page } from "@playwright/test";

import { createTestDb } from "./db";

const adminEmail = () => process.env.E2E_ADMIN_EMAIL!;
const adminPassword = () => process.env.E2E_ADMIN_PASSWORD ?? "123456";

const SUBSCRIBER = "e2e+newsletter@example.com";

async function signIn(page: Page) {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(adminEmail());
  await page.getByLabel("Password").fill(adminPassword());
  await page.getByRole("button", { name: "Sign In with credentials" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/sign-in"));
}

// The storefront picks up a save within a moment; reload until it shows
async function expectOnStorefront(visitor: Page, check: () => Promise<void>) {
  await expect(async () => {
    await visitor.goto("/");
    await check();
  }).toPass({ timeout: 15_000 });
}

// Waits for the save to finish (the toast) before checking the storefront
async function expectSaved(page: Page) {
  await expect(page.getByText("Saved. The site is updated.").last()).toBeVisible();
}

// Snapshot of everything this test changes, restored afterwards
type Snapshot = {
  settings: unknown | null;
  sections: { id: string; enabled: boolean; position: number; data: unknown }[];
  about: { published: boolean; showInFooter: boolean } | null;
};

let snapshot: Snapshot;

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  const db = createTestDb();

  try {
    const [settings, sections, about] = await Promise.all([
      db.siteSettings.findUnique({ where: { id: 1 } }),
      db.homeSection.findMany({ select: { id: true, enabled: true, position: true, data: true } }),
      db.page.findUnique({ where: { slug: "about" }, select: { published: true, showInFooter: true } }),
    ]);

    snapshot = { settings: settings?.data ?? null, sections, about };
  } finally {
    await db.$disconnect();
  }
});

test.afterAll(async ({ browser }) => {
  const db = createTestDb();

  try {
    if (snapshot.settings === null) {
      await db.siteSettings.deleteMany({ where: { id: 1 } });
    } else {
      await db.siteSettings.update({ where: { id: 1 }, data: { data: snapshot.settings as object } });
    }

    for (const section of snapshot.sections) {
      await db.homeSection.update({
        where: { id: section.id },
        data: { enabled: section.enabled, position: section.position, data: section.data as object },
      });
    }

    if (snapshot.about) {
      await db.page.update({ where: { slug: "about" }, data: snapshot.about });
    }

    await db.newsletterSubscriber.deleteMany({ where: { email: SUBSCRIBER } });
    await db.auditLog.deleteMany({ where: { action: { startsWith: "site." }, createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) } } });
  } finally {
    await db.$disconnect();
  }

  // The storefront caches site content; a Studio save refreshes it
  const context = await browser.newContext();
  const page = await context.newPage();
  await signIn(page);
  await page.goto("/studio/branding");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expectSaved(page);
  await context.close();
});

test("Studio changes show up on the storefront", async ({ page, browser }) => {
  await signIn(page);

  const visitor = await (await browser.newContext()).newPage();

  await test.step("site name", async () => {
    await page.goto("/studio/branding");
    await page.getByLabel("Site name").fill("E2E Leather Co");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expectSaved(page);

    await expectOnStorefront(visitor, async () => {
      await expect(
        visitor.getByRole("banner").getByRole("link", { name: "E2E Leather Co" }),
      ).toBeVisible({ timeout: 2_000 });
      await expect(visitor).toHaveTitle(/E2E Leather Co/, { timeout: 2_000 });
    });
  });

  await test.step("brand color", async () => {
    await page.goto("/studio/theme");
    await page.getByRole("button", { name: "Forest" }).click();
    await page.getByRole("button", { name: "Save theme" }).click();
    await expectSaved(page);

    await expectOnStorefront(visitor, async () => {
      expect(await visitor.locator("style").allTextContents()).toContainEqual(
        expect.stringContaining("--brand:#24543A"),
      );
    });
  });

  await test.step("announcement bar", async () => {
    await page.goto("/studio/announcement");
    await page.getByLabel("Show the announcement bar").selectOption("true");
    await page.getByLabel("Message", { exact: true }).fill("E2E sale today only");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expectSaved(page);

    await expectOnStorefront(visitor, async () => {
      await expect(visitor.getByText("E2E sale today only")).toBeVisible({ timeout: 2_000 });
    });
  });

  await test.step("show the FAQ and newsletter sections", async () => {
    await page.goto("/studio/home");

    for (const name of ["FAQ", "Newsletter sign-up"]) {
      // The first section of each kind (a store layout may have added a second)
      const row = page
        .getByRole("listitem")
        .filter({ has: page.getByText(name, { exact: true }) })
        .first();
      const show = row.getByRole("button", { name: "Show" });

      // Skip sections that are already shown
      if (await show.isVisible()) {
        await show.click();
      }

      await expect(row.getByText("Shown", { exact: true })).toBeVisible();
    }

    const main = visitor.getByRole("main");

    await expectOnStorefront(visitor, async () => {
      await expect(main.locator("details").first()).toBeVisible({ timeout: 2_000 });
      await expect(main.getByLabel("Email address")).toBeVisible({ timeout: 2_000 });
    });

    // The home page sign-up, not the one in the footer
    await main.getByLabel("Email address").fill(SUBSCRIBER);
    await main.getByRole("button", { name: "Subscribe" }).click();
    await expect(visitor.getByText("You're subscribed")).toBeVisible();

    await page.goto("/studio/subscribers");
    await expect(page.getByText(SUBSCRIBER)).toBeVisible();
  });

  await test.step("publish the About page", async () => {
    await page.goto("/studio/pages");
    await page.getByRole("link", { name: /About us/ }).click();
    await page.getByLabel("Published (visible to customers)").check();
    await page.getByRole("button", { name: "Save page" }).click();
    await expect(page.getByText("Page saved and published")).toBeVisible();

    await expectOnStorefront(visitor, async () => {
      await expect(
        visitor.getByRole("contentinfo").getByRole("link", { name: "About us" }),
      ).toBeVisible({ timeout: 2_000 });
    });
    await visitor.getByRole("contentinfo").getByRole("link", { name: "About us" }).click();
    await visitor.waitForURL(/\/pages\/about$/);
    await expect(visitor.getByRole("heading", { name: "Who we are" })).toBeVisible();
  });
});
