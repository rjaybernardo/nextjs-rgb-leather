"use server";

import { revalidatePath } from "next/cache";

import { recordAudit } from "@/lib/audit";
import { assertAdmin, requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { getClientIp, assertRateLimit } from "@/lib/rate-limit";
import { invalidateSite, parseSectionData } from "@/lib/site";
import {
  isSectionType,
  pageSchema,
  resolveSiteSettings,
  SECTION_DEFAULTS,
  sectionSchemas,
  siteSettingsSchema,
  type PageInput,
  type SectionType,
} from "@/lib/site-config";
import { formatError } from "@/lib/utils/server";
import { z } from "zod";

type Result = { success: boolean; message: string };

const ok = (message: string): Result => ({ success: true, message });
const fail = (error: unknown): Result => ({ success: false, message: formatError(error) });

// ------------------------------------------------------------- settings

export async function getStudioSettings() {
  await requireAdmin();

  const row = await prisma.siteSettings.findUnique({ where: { id: 1 } });

  return resolveSiteSettings(row?.data);
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

// Deep-merge one Studio page's changes into the saved settings
function mergeSettings(base: Record<string, unknown>, changes: Record<string, unknown>) {
  const result: Record<string, unknown> = { ...base };

  for (const [key, value] of Object.entries(changes)) {
    result[key] =
      isPlainObject(value) && isPlainObject(base[key])
        ? mergeSettings(base[key] as Record<string, unknown>, value)
        : value;
  }

  return result;
}

export async function updateSiteSettings(changes: Record<string, unknown>): Promise<Result> {
  try {
    const session = await assertAdmin();

    const row = await prisma.siteSettings.findUnique({ where: { id: 1 } });
    const current = resolveSiteSettings(row?.data);

    const next = siteSettingsSchema.parse(mergeSettings(current, changes));

    await prisma.siteSettings.upsert({
      where: { id: 1 },
      create: { id: 1, data: next },
      update: { data: next },
    });

    await recordAudit({
      actor: session,
      action: "site.settings.update",
      entityType: "site",
      details: { changed: Object.keys(changes) },
    });

    invalidateSite();

    return ok("Saved. The site is updated.");
  } catch (error) {
    return fail(error);
  }
}

// ------------------------------------------------------------- sections

export async function getStudioSections() {
  await requireAdmin();

  const rows = await prisma.homeSection.findMany({ orderBy: { position: "asc" } });

  return rows
    .filter((row) => isSectionType(row.type))
    .map((row) => ({
      id: row.id,
      type: row.type as SectionType,
      enabled: row.enabled,
      data: parseSectionData(row.type as SectionType, row.data) as Record<string, unknown>,
    }));
}

export async function addSection(type: string): Promise<Result> {
  try {
    const session = await assertAdmin();

    if (!isSectionType(type)) {
      throw new Error("Unknown section type");
    }

    const last = await prisma.homeSection.findFirst({
      orderBy: { position: "desc" },
      select: { position: true },
    });

    const created = await prisma.homeSection.create({
      data: {
        type,
        position: (last?.position ?? -1) + 1,
        // New sections start hidden so you can fill them in first
        enabled: false,
        data: SECTION_DEFAULTS[type](),
      },
    });

    await recordAudit({
      actor: session,
      action: "site.section.create",
      entityType: "section",
      entityId: created.id,
      details: { type },
    });

    invalidateSite();

    return ok("Section added at the bottom. It's hidden until you show it.");
  } catch (error) {
    return fail(error);
  }
}

export async function updateSectionData(id: string, data: unknown): Promise<Result> {
  try {
    const session = await assertAdmin();

    const section = await prisma.homeSection.findUnique({ where: { id } });

    if (!section || !isSectionType(section.type)) {
      throw new Error("Section not found");
    }

    const parsed = sectionSchemas[section.type as SectionType].parse(data);

    await prisma.homeSection.update({ where: { id }, data: { data: parsed } });

    await recordAudit({
      actor: session,
      action: "site.section.update",
      entityType: "section",
      entityId: id,
      details: { type: section.type },
    });

    invalidateSite();

    return ok("Section saved");
  } catch (error) {
    return fail(error);
  }
}

export async function setSectionEnabled(id: string, enabled: boolean): Promise<Result> {
  try {
    const session = await assertAdmin();

    const section = await prisma.homeSection.update({
      where: { id },
      data: { enabled },
      select: { type: true },
    });

    await recordAudit({
      actor: session,
      action: enabled ? "site.section.show" : "site.section.hide",
      entityType: "section",
      entityId: id,
      details: { type: section.type },
    });

    invalidateSite();

    return ok(enabled ? "Section is now shown" : "Section is now hidden");
  } catch (error) {
    return fail(error);
  }
}

export async function moveSection(id: string, direction: "up" | "down"): Promise<Result> {
  try {
    await assertAdmin();

    await prisma.$transaction(async (tx) => {
      const sections = await tx.homeSection.findMany({
        orderBy: { position: "asc" },
        select: { id: true },
      });

      const index = sections.findIndex((section) => section.id === id);
      const target = direction === "up" ? index - 1 : index + 1;

      if (index === -1 || target < 0 || target >= sections.length) return;

      const order = sections.map((section) => section.id);
      [order[index], order[target]] = [order[target], order[index]];

      // Rewrite positions 0..n so gaps or duplicates can't build up
      for (const [position, sectionId] of order.entries()) {
        await tx.homeSection.update({ where: { id: sectionId }, data: { position } });
      }
    });

    invalidateSite();

    return ok("Section moved");
  } catch (error) {
    return fail(error);
  }
}

export async function deleteSection(id: string): Promise<Result> {
  try {
    const session = await assertAdmin();

    const section = await prisma.homeSection.delete({
      where: { id },
      select: { type: true },
    });

    await recordAudit({
      actor: session,
      action: "site.section.delete",
      entityType: "section",
      entityId: id,
      details: { type: section.type },
    });

    invalidateSite();

    return ok("Section deleted");
  } catch (error) {
    return fail(error);
  }
}

// ------------------------------------------------------------- pages

export async function getStudioPages() {
  await requireAdmin();

  return prisma.page.findMany({
    orderBy: [{ position: "asc" }, { title: "asc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      published: true,
      showInFooter: true,
      updatedAt: true,
    },
  });
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getStudioPage(id: string) {
  await requireAdmin();

  // Malformed ids would be a database error; treat them as not found
  if (!UUID.test(id)) return null;

  return prisma.page.findUnique({ where: { id } });
}

const slugTaken = async (slug: string, exceptId?: string) =>
  Boolean(
    await prisma.page.findFirst({
      where: { slug, ...(exceptId ? { NOT: { id: exceptId } } : {}) },
      select: { id: true },
    }),
  );

export async function createPage(input: PageInput): Promise<Result & { id?: string }> {
  try {
    const session = await assertAdmin();
    const data = pageSchema.parse(input);

    if (await slugTaken(data.slug)) {
      throw new Error(`A page already uses /pages/${data.slug}`);
    }

    const last = await prisma.page.findFirst({
      orderBy: { position: "desc" },
      select: { position: true },
    });

    const page = await prisma.page.create({
      data: { ...data, position: (last?.position ?? -1) + 1 },
    });

    await recordAudit({
      actor: session,
      action: "site.page.create",
      entityType: "page",
      entityId: page.id,
      details: { slug: page.slug },
    });

    invalidateSite();

    return { ...ok("Page created"), id: page.id };
  } catch (error) {
    return fail(error);
  }
}

export async function updatePage(id: string, input: PageInput): Promise<Result> {
  try {
    const session = await assertAdmin();
    const data = pageSchema.parse(input);

    const existing = await prisma.page.findUnique({ where: { id }, select: { slug: true } });

    if (!existing) {
      throw new Error("Page not found");
    }

    if (await slugTaken(data.slug, id)) {
      throw new Error(`A page already uses /pages/${data.slug}`);
    }

    await prisma.page.update({ where: { id }, data });

    await recordAudit({
      actor: session,
      action: "site.page.update",
      entityType: "page",
      entityId: id,
      details: {
        slug: data.slug,
        published: data.published,
        ...(existing.slug !== data.slug ? { slugChanged: { before: existing.slug, after: data.slug } } : {}),
      },
    });

    invalidateSite();
    revalidatePath(`/pages/${existing.slug}`);
    revalidatePath(`/pages/${data.slug}`);

    return ok(data.published ? "Page saved and published" : "Page saved as a draft");
  } catch (error) {
    return fail(error);
  }
}

export async function deletePage(id: string): Promise<Result> {
  try {
    const session = await assertAdmin();

    const page = await prisma.page.delete({ where: { id }, select: { slug: true } });

    await recordAudit({
      actor: session,
      action: "site.page.delete",
      entityType: "page",
      entityId: id,
      details: { slug: page.slug },
    });

    invalidateSite();
    revalidatePath(`/pages/${page.slug}`);

    return ok("Page deleted");
  } catch (error) {
    return fail(error);
  }
}

// ------------------------------------------------------------- newsletter

const SUBSCRIBERS_PAGE_SIZE = 50;

export async function getSubscribers({ page }: { page: number }) {
  await requireAdmin();

  const [subscribers, total] = await Promise.all([
    prisma.newsletterSubscriber.findMany({
      orderBy: { createdAt: "desc" },
      take: SUBSCRIBERS_PAGE_SIZE,
      skip: (page - 1) * SUBSCRIBERS_PAGE_SIZE,
    }),
    prisma.newsletterSubscriber.count(),
  ]);

  return {
    subscribers,
    total,
    totalPages: Math.max(1, Math.ceil(total / SUBSCRIBERS_PAGE_SIZE)),
  };
}

export async function deleteSubscriber(id: string): Promise<Result> {
  try {
    const session = await assertAdmin();

    const subscriber = await prisma.newsletterSubscriber.delete({
      where: { id },
      select: { email: true },
    });

    await recordAudit({
      actor: session,
      action: "site.subscriber.delete",
      entityType: "subscriber",
      entityId: id,
      details: { email: subscriber.email },
    });

    revalidatePath("/studio/subscribers");

    return ok("Subscriber removed");
  } catch (error) {
    return fail(error);
  }
}

// Public: the newsletter section on the home page
export async function subscribeNewsletter(_prevState: unknown, formData: FormData): Promise<Result> {
  try {
    const email = z
      .email({ error: "Enter a valid email address" })
      .parse(String(formData.get("email") ?? "").trim().toLowerCase());

    await assertRateLimit({
      key: `newsletter:${await getClientIp()}`,
      limit: 5,
      windowMs: 60 * 60 * 1000,
    });

    // Same answer for new and existing emails, so it can't reveal who subscribed
    await prisma.newsletterSubscriber.upsert({
      where: { email },
      create: { email },
      update: {},
    });

    return ok("You're subscribed. Thanks!");
  } catch (error) {
    return fail(error);
  }
}
