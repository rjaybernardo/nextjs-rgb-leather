"use server";

import { revalidatePath } from "next/cache";
import slugify from "slugify";

import { recordAudit } from "@/lib/audit";
import { invalidateCatalog } from "@/lib/catalog-cache";
import { assertAdmin, requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { formatError } from "@/lib/utils/server";
import { taxonomyNameSchema } from "@/lib/validators";

export type TaxonomyKind = "category" | "brand";

const LABEL: Record<TaxonomyKind, string> = {
  category: "Category",
  brand: "Brand",
};

const toSlug = (name: string) => slugify(name, { lower: true, strict: true });

// Categories and brands share the same shape, so one set of helpers serves both
const table = (kind: TaxonomyKind) =>
  (kind === "category" ? prisma.category : prisma.brand) as typeof prisma.category;

const revalidateTaxonomy = () => {
  invalidateCatalog();
  revalidatePath("/admin/categories");
  revalidatePath("/search");
  revalidatePath("/", "layout");
};

// For the product form dropdowns
export async function getTaxonomyOptions() {
  await requireAdmin();

  const [categories, brands] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.brand.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return { categories, brands };
}

// For the admin Categories page, with how many products use each
export async function getTaxonomyWithCounts() {
  await requireAdmin();

  const include = { _count: { select: { products: true } } } as const;

  const [categories, brands] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" }, include }),
    prisma.brand.findMany({ orderBy: { name: "asc" }, include }),
  ]);

  const shape = (rows: typeof categories) =>
    rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      productCount: row._count.products,
    }));

  return { categories: shape(categories), brands: shape(brands as typeof categories) };
}

async function assertUnique(kind: TaxonomyKind, name: string, slug: string, exceptId?: string) {
  const clash = await table(kind).findFirst({
    where: {
      OR: [{ name: { equals: name, mode: "insensitive" } }, { slug }],
      ...(exceptId ? { NOT: { id: exceptId } } : {}),
    },
    select: { name: true },
  });

  if (clash) {
    throw new Error(`${LABEL[kind]} "${clash.name}" already exists`);
  }
}

export async function createTaxonomy(kind: TaxonomyKind, rawName: string) {
  try {
    const session = await assertAdmin();
    const name = taxonomyNameSchema.parse(rawName);
    const slug = toSlug(name);

    if (!slug) {
      throw new Error("Name must contain letters or numbers");
    }

    await assertUnique(kind, name, slug);

    const created = await table(kind).create({
      data: { name, slug },
    });

    await recordAudit({
      actor: session,
      action: `${kind}.create`,
      entityType: kind,
      entityId: created.id,
      details: { name },
    });

    revalidateTaxonomy();

    return { success: true, message: `${LABEL[kind]} added` };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Renaming also updates the slug, so category links change with the name
export async function renameTaxonomy(
  kind: TaxonomyKind,
  id: string,
  rawName: string,
) {
  try {
    const session = await assertAdmin();
    const name = taxonomyNameSchema.parse(rawName);
    const slug = toSlug(name);

    if (!slug) {
      throw new Error("Name must contain letters or numbers");
    }

    const existing = await table(kind).findUnique({ where: { id } });

    if (!existing) {
      throw new Error(`${LABEL[kind]} not found`);
    }

    await assertUnique(kind, name, slug, id);

    await table(kind).update({
      where: { id },
      data: { name, slug },
    });

    await recordAudit({
      actor: session,
      action: `${kind}.update`,
      entityType: kind,
      entityId: id,
      details: { name: { before: existing.name, after: name } },
    });

    revalidateTaxonomy();

    return { success: true, message: `${LABEL[kind]} renamed` };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function deleteTaxonomy(kind: TaxonomyKind, id: string) {
  try {
    const session = await assertAdmin();

    const existing = await table(kind).findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });

    if (!existing) {
      throw new Error(`${LABEL[kind]} not found`);
    }

    if (existing._count.products > 0) {
      throw new Error(
        `${existing.name} is used by ${existing._count.products} product${existing._count.products === 1 ? "" : "s"}. Move them first.`,
      );
    }

    await table(kind).delete({ where: { id } });

    await recordAudit({
      actor: session,
      action: `${kind}.delete`,
      entityType: kind,
      entityId: id,
      details: { name: existing.name },
    });

    revalidateTaxonomy();

    return { success: true, message: `${LABEL[kind]} deleted` };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}
