import "server-only";

import { revalidatePath, updateTag } from "next/cache";
import { connection } from "next/server";
import { cache } from "react";

import { prisma } from "@/lib/prisma";
import {
  isSectionType,
  resolveSiteSettings,
  SECTION_DEFAULTS,
  sectionSchemas,
  type SectionData,
  type SectionType,
} from "@/lib/site-config";
import { cachedQuery } from "@/lib/cached-query";

/*
 * Storefront reads for Site Studio content. Cached because the header,
 * footer and home page need them on every request; Studio saves call
 * invalidateSite() so changes appear immediately.
 */
export const SITE_TAG = "site";

const siteCache = { tags: [SITE_TAG], revalidate: 300 };

// Server actions only. updateTag expires entries immediately; revalidateTag
// with a profile can still serve the old copy to the next visitor.
export function invalidateSite() {
  updateTag(SITE_TAG);
  revalidatePath("/", "layout");
}

const cachedSettings = cachedQuery(
  async () => {
    const row = await prisma.siteSettings.findUnique({ where: { id: 1 } });
    return resolveSiteSettings(row?.data);
  },
  ["site-settings"],
  siteCache,
);

// Request-time only, so builds don't need a database connection
export const getSiteSettings = cache(async () => {
  await connection();
  return cachedSettings();
});

export type HomeSectionView = {
  [T in SectionType]: { id: string; type: T; data: SectionData<T> };
}[SectionType];

// Validates stored data, falling back to defaults for anything malformed
export function parseSectionData<T extends SectionType>(type: T, data: unknown): SectionData<T> {
  const parsed = sectionSchemas[type].safeParse({
    ...SECTION_DEFAULTS[type](),
    ...(data && typeof data === "object" ? data : {}),
  });

  return (parsed.success ? parsed.data : SECTION_DEFAULTS[type]()) as SectionData<T>;
}

const cachedHomeSections = cachedQuery(
  async () => {
    const rows = await prisma.homeSection.findMany({
      where: { enabled: true },
      orderBy: { position: "asc" },
    });

    return rows
      .filter((row) => isSectionType(row.type))
      .map((row) => {
        const type = row.type as SectionType;
        return { id: row.id, type, data: parseSectionData(type, row.data) } as HomeSectionView;
      });
  },
  ["home-sections"],
  siteCache,
);

export const getHomeSections = cache(async () => {
  await connection();
  return cachedHomeSections();
});

const cachedFooterPages = cachedQuery(
  async () =>
    prisma.page.findMany({
      where: { published: true, showInFooter: true },
      orderBy: [{ position: "asc" }, { title: "asc" }],
      select: { slug: true, title: true },
    }),
  ["footer-pages"],
  siteCache,
);

export const getFooterPages = cache(async () => {
  await connection();
  return cachedFooterPages();
});

const cachedPublishedPage = cachedQuery(
  async (slug: string) =>
    prisma.page.findFirst({
      where: { slug, published: true },
      select: { slug: true, title: true, description: true, content: true, updatedAt: true },
    }),
  ["published-page"],
  siteCache,
);

export const getPublishedPage = cache(async (slug: string) => {
  await connection();
  return cachedPublishedPage(slug);
});
