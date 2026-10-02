import "server-only";

import { updateTag } from "next/cache";

/*
 * Storefront catalog reads (categories, product lists, product pages) are
 * cached because every page shows the category menu and the database is a
 * ~300 ms round trip away. Anything that changes products, stock, ratings or
 * categories must call invalidateCatalog().
 */
export const CATALOG_TAG = "catalog";

// Safety net: cached entries refresh at least this often (seconds)
export const CATALOG_REVALIDATE_SECONDS = 300;

// Server actions only (all catalog changes happen in actions). updateTag
// expires entries immediately; revalidateTag with a profile can still serve
// the old copy to the next visitor.
export function invalidateCatalog() {
  updateTag(CATALOG_TAG);
}
